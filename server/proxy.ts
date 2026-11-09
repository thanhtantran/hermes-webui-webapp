import { Readable } from 'node:stream';
import { Router, type Request, type Response } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { AppConfig } from './config';
import { shortHash } from './crypto';
import { getInstance, type InstanceRow } from './db';
import { createRequireAuth } from './auth';
import { assertTargetAllowed } from './target';

const REQUEST_HEADER_ALLOWLIST = new Set([
  'accept',
  'accept-language',
  'cache-control',
  'content-type',
  'if-modified-since',
  'if-none-match',
  'range',
  'user-agent',
]);

const RESPONSE_HEADER_BLOCKLIST = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'content-security-policy',
  'content-security-policy-report-only',
  'frame-options',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'public-key-pins',
  'set-cookie',
  'strict-transport-security',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'x-frame-options',
]);

function cookiePrefix(instanceId: string): string {
  return `__hpx_${shortHash(instanceId, 12)}_`;
}

function extractTargetCookies(cookieHeader: string | undefined, prefix: string): string | undefined {
  if (!cookieHeader) return undefined;
  const forwarded: string[] = [];

  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const name = trimmed.slice(0, separator).trim();
    if (!name.startsWith(prefix)) continue;
    forwarded.push(`${name.slice(prefix.length)}=${trimmed.slice(separator + 1)}`);
  }

  return forwarded.length > 0 ? forwarded.join('; ') : undefined;
}

function rewriteSetCookie(rawCookie: string, prefix: string): string | null {
  const parts = rawCookie.split(';');
  const pair = parts.shift();
  if (!pair) return null;

  const separator = pair.indexOf('=');
  if (separator <= 0) return null;

  const name = pair.slice(0, separator).trim();
  if (!name) return null;

  const attributes: string[] = [];
  for (const part of parts) {
    const attribute = part.trim();
    if (!attribute) continue;
    const attributeName = attribute.split('=')[0]?.trim().toLowerCase();
    if (attributeName === 'domain' || attributeName === 'path') continue;
    attributes.push(attribute);
  }
  attributes.push('Path=/api/proxy');

  return [`${prefix}${name}=${pair.slice(separator + 1)}`, ...attributes].join('; ');
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildProxyScript(targetOrigin: string, instanceId: string): string {
  return `<script>
(function () {
  var instanceId = ${JSON.stringify(instanceId)};
  var targetOrigin = ${JSON.stringify(targetOrigin)};
  function proxyUrl(input) {
    try {
      var resolved = new URL(input, targetOrigin + "/").toString();
      if (resolved === targetOrigin || resolved.indexOf(targetOrigin + "/") === 0) {
        return "/api/proxy?instanceId=" + encodeURIComponent(instanceId) + "&url=" + encodeURIComponent(resolved);
      }
    } catch (error) {}
    return null;
  }
  var nativeFetch = window.fetch;
  if (nativeFetch) {
    window.fetch = function (input, init) {
      if (typeof input === "string") {
        var mapped = proxyUrl(input);
        if (mapped) return nativeFetch.call(this, mapped, init);
      } else if (input instanceof Request) {
        var mappedRequest = proxyUrl(input.url);
        if (mappedRequest) return nativeFetch.call(this, new Request(mappedRequest, input));
      }
      return nativeFetch.apply(this, arguments);
    };
  }
  var nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    var mapped = typeof url === "string" ? proxyUrl(url) : null;
    var args = Array.prototype.slice.call(arguments);
    if (mapped) args[1] = mapped;
    return nativeOpen.apply(this, args);
  };
  var NativeEventSource = window.EventSource;
  if (NativeEventSource) {
    window.EventSource = function (url, options) {
      var mapped = typeof url === "string" ? proxyUrl(url) : null;
      return new NativeEventSource(mapped || url, options);
    };
    window.EventSource.prototype = NativeEventSource.prototype;
  }
})();
</script>`;
}

function injectProxyBootstrap(html: string, targetOrigin: string, instanceId: string): string {
  const baseTag = `<base href="${escapeHtmlAttribute(targetOrigin)}/">`;
  const bootstrap = baseTag + buildProxyScript(targetOrigin, instanceId);

  if (html.includes('<head>')) return html.replace('<head>', `<head>${bootstrap}`);
  if (/<head\s/i.test(html)) return html.replace(/<head[^>]*>/i, (match) => `${match}${bootstrap}`);
  return `${bootstrap}${html}`;
}

function buildProxyUrl(instanceId: string, targetUrl: URL): string {
  return `/api/proxy?instanceId=${encodeURIComponent(instanceId)}&url=${encodeURIComponent(
    targetUrl.toString()
  )}`;
}

function rejectCrossSite(req: Request, res: Response): boolean {
  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') {
    res.status(403).json({ error: 'Cross-site proxy requests are not allowed.' });
    return true;
  }
  return false;
}

async function proxyRequest(
  req: Request,
  res: Response,
  config: AppConfig,
  instance: InstanceRow
): Promise<void> {
  if (rejectCrossSite(req, res)) return;

  const instanceOrigin = new URL(instance.url).origin;
  const requestedUrl = typeof req.query.url === 'string' ? req.query.url : instance.url;

  let targetUrl: URL;
  try {
    targetUrl = new URL(requestedUrl);
  } catch {
    res.status(400).json({ error: 'Invalid target URL.' });
    return;
  }

  if (targetUrl.origin !== instanceOrigin) {
    res.status(403).json({ error: 'Target origin does not match this instance.' });
    return;
  }

  try {
    await assertTargetAllowed(targetUrl.toString(), config);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Target is not allowed.' });
    return;
  }

  const prefix = cookiePrefix(instance.id);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (typeof value !== 'string') continue;
    if (!REQUEST_HEADER_ALLOWLIST.has(name.toLowerCase())) continue;
    headers.set(name, value);
  }
  headers.set('Origin', instanceOrigin);
  headers.set('Referer', `${instanceOrigin}/`);

  const targetCookies = extractTargetCookies(req.headers.cookie, prefix);
  if (targetCookies) headers.set('Cookie', targetCookies);

  const method = req.method.toUpperCase();
  const hasBody =
    method !== 'GET' && method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0;

  const isEventStream = (req.headers.accept || '').includes('text/event-stream');
  const controller = new AbortController();
  const timeout = isEventStream ? null : setTimeout(() => controller.abort(), config.proxyTimeoutMs);

  let response: globalThis.Response;
  try {
    response = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? req.body : undefined,
      redirect: 'manual',
      signal: controller.signal,
    });
  } catch (error) {
    if (timeout) clearTimeout(timeout);
    const message = error instanceof Error ? error.message : 'Upstream request failed.';
    const status = controller.signal.aborted ? 504 : 502;
    res.status(status).json({ error: message });
    return;
  }
  if (timeout) clearTimeout(timeout);

  res.status(response.status);

  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (RESPONSE_HEADER_BLOCKLIST.has(lower)) return;
    if (lower.startsWith('access-control-')) return;
    res.setHeader(key, value);
  });

  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    const rewritten = rewriteSetCookie(cookie, prefix);
    if (rewritten) res.append('Set-Cookie', rewritten);
  }

  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
  res.removeHeader('X-Frame-Options');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const location = response.headers.get('location');
  if (location && response.status >= 300 && response.status < 400) {
    try {
      const absolute = new URL(location, targetUrl);
      res.setHeader(
        'Location',
        absolute.origin === instanceOrigin ? buildProxyUrl(instance.id, absolute) : absolute.toString()
      );
    } catch {
      // Keep the upstream Location if it cannot be parsed.
    }
    res.end();
    return;
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const html = await response.text();
    res.send(injectProxyBootstrap(html, instanceOrigin, instance.id));
    return;
  }

  if (!response.body || method === 'HEAD') {
    res.end();
    return;
  }

  Readable.fromWeb(response.body as import('node:stream/web').ReadableStream).pipe(res);
}

export function createProxyRouter(db: DatabaseSync, config: AppConfig): Router {
  const router = Router();
  const requireAuth = createRequireAuth(db, config);

  router.all('/proxy', requireAuth, (req, res) => {
    const instanceId = typeof req.query.instanceId === 'string' ? req.query.instanceId : '';
    if (!instanceId) {
      res.status(400).json({ error: 'Missing instanceId parameter.' });
      return;
    }

    const instance = getInstance(db, req.auth!.user.id, instanceId);
    if (!instance) {
      res.status(404).json({ error: 'Instance not found.' });
      return;
    }

    proxyRequest(req, res, config, instance).catch((error) => {
      console.error('Proxy error:', error);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Proxy request failed.' });
      } else {
        res.end();
      }
    });
  });

  return router;
}

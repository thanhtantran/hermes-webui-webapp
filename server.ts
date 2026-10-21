import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Support raw body for proxying POST/PUT payloads
  app.use(express.raw({ type: '*/*', limit: '50mb' }));

  // API Proxy endpoint: Bypasses X-Frame-Options and Content-Security-Policy
  // allowing remote Hermes instances to be securely rendered inside the iframe.
  app.all('/api/proxy', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send('Missing url parameter');
    }

    try {
      const parsedUrl = new URL(targetUrl);
      const targetOrigin = parsedUrl.origin;

      const forwardHeaders: Record<string, string> = {
        'User-Agent':
          (req.headers['user-agent'] as string) ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': (req.headers['accept'] as string) || '*/*',
        'Accept-Language': (req.headers['accept-language'] as string) || 'en-US,en;q=0.9,vi;q=0.8',
      };

      if (req.headers['content-type']) {
        forwardHeaders['Content-Type'] = req.headers['content-type'] as string;
      }
      if (req.headers['cookie']) {
        forwardHeaders['Cookie'] = req.headers['cookie'] as string;
      }

      const method = req.method.toUpperCase();
      const hasBody = method !== 'GET' && method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0;

      const fetchOptions: RequestInit = {
        method,
        headers: forwardHeaders,
        redirect: 'follow',
      };

      if (hasBody) {
        fetchOptions.body = req.body;
      }

      const response = await fetch(targetUrl, fetchOptions);

      res.status(response.status);

      // Copy response headers, explicitly stripping frame-blocking and compression headers
      // (fetch automatically decompresses Brotli/Gzip, so forwarding content-encoding causes browser errors)
      response.headers.forEach((val, key) => {
        const lower = key.toLowerCase();
        if (
          lower === 'x-frame-options' ||
          lower === 'content-security-policy' ||
          lower === 'content-security-policy-report-only' ||
          lower === 'frame-options' ||
          lower === 'content-encoding' ||
          lower === 'content-length'
        ) {
          return;
        }

        // Forward cookies properly
        if (lower === 'set-cookie') {
          res.setHeader('Set-Cookie', val);
          return;
        }

        res.setHeader(key, val);
      });

      // Enable open framing and CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.removeHeader('X-Frame-Options');

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        let html = await response.text();

        // 1. Inject base tag so relative links, assets, and styles load
        const baseTag = `<base href="${targetOrigin}/">`;

        // 2. Inject script to proxy client fetch/XHR calls through /api/proxy so API calls succeed without CORS errors
        const proxyScript = `
<script>
(function() {
  var origin = ${JSON.stringify(targetOrigin)};
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      try {
        var resolved = new URL(input, origin + '/').toString();
        if (resolved.startsWith(origin)) {
          return origFetch('/api/proxy?url=' + encodeURIComponent(resolved), init);
        }
      } catch(e) {}
    }
    return origFetch(input, init);
  };
})();
</script>
`;

        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${baseTag}${proxyScript}`);
        } else if (html.includes('<head ')) {
          html = html.replace(/<head[^>]*>/, `$&${baseTag}${proxyScript}`);
        } else {
          html = `${baseTag}${proxyScript}${html}`;
        }

        return res.send(html);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return res.send(buffer);
    } catch (err: any) {
      return res.status(502).send(`Proxy Error: ${err?.message || 'Failed to connect to target host'}`);
    }
  });

  // Fast backend ping endpoint: accurately checks reachability without browser CORS limitations
  app.get('/api/ping', async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing url' });
    }

    const start = performance.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(targetUrl, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Math.round(performance.now() - start);

      return res.json({
        isOnline: true,
        statusCode: response.status,
        latencyMs: Math.max(1, latencyMs),
      });
    } catch {
      clearTimeout(timeout);

      // Retry with GET if HEAD was rejected with 501 / 405
      try {
        const retryController = new AbortController();
        const retryTimeout = setTimeout(() => retryController.abort(), 3000);
        const retryStart = performance.now();

        const getResp = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
          signal: retryController.signal,
        });
        clearTimeout(retryTimeout);
        const latencyMs = Math.round(performance.now() - retryStart);

        return res.json({
          isOnline: true,
          statusCode: getResp.status,
          latencyMs: Math.max(1, latencyMs),
        });
      } catch (err: any) {
        const elapsed = Math.round(performance.now() - start);
        return res.json({
          isOnline: false,
          latencyMs: elapsed,
          error: err?.message || 'Connection refused or host unreachable',
        });
      }
    }
  });

  // Mount Vite in development mode or serve static files in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.use((_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hermes Console server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

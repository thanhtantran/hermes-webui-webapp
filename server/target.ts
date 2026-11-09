import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';
import type { AppConfig } from './config';

export class TargetValidationError extends Error {}

const ALWAYS_BLOCKED_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'metadata',
]);

const ALWAYS_BLOCKED_IPS = new Set([
  '169.254.169.254',
  '169.254.170.2',
  '100.100.100.200',
  'fd00:ec2::254',
]);

export function normalizeTargetUrl(input: string): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new TargetValidationError('URL is required.');
  if (trimmed.length > 2048) throw new TargetValidationError('URL is too long.');

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new TargetValidationError('Invalid URL syntax.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TargetValidationError('Only http:// and https:// endpoints are supported.');
  }
  if (parsed.username || parsed.password) {
    throw new TargetValidationError('URLs containing embedded credentials are not allowed.');
  }
  if (!parsed.hostname) {
    throw new TargetValidationError('URL must include a hostname.');
  }

  return parsed.toString();
}

function isPrivateIpv4(address: string): boolean {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  return (
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.')
  );
}

function isAlwaysBlockedIp(address: string): boolean {
  return ALWAYS_BLOCKED_IPS.has(address.toLowerCase());
}

function matchesHostAllowlist(hostname: string, allowlist: string[]): boolean {
  if (allowlist.length === 0) return true;
  const host = hostname.toLowerCase();
  return allowlist.some((entry) => {
    const normalized = entry.replace(/^\*\./, '').replace(/^\./, '');
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}

export async function assertTargetAllowed(url: string, config: AppConfig): Promise<URL> {
  const parsed = new URL(normalizeTargetUrl(url));
  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (!matchesHostAllowlist(hostname, config.instanceHostAllowlist)) {
    throw new TargetValidationError('Host is not permitted by INSTANCE_HOST_ALLOWLIST.');
  }
  if (ALWAYS_BLOCKED_HOSTS.has(hostname) || isAlwaysBlockedIp(hostname)) {
    throw new TargetValidationError('Cloud metadata endpoints are not allowed.');
  }

  if (config.blockPrivateTargets) {
    if (isIP(hostname)) {
      const isPrivate = isIP(hostname) === 4 ? isPrivateIpv4(hostname) : isPrivateIpv6(hostname);
      if (isPrivate) {
        throw new TargetValidationError('Private network targets are disabled on this server.');
      }
    } else {
      let addresses: Array<{ address: string }>;
      try {
        addresses = await lookup(hostname, { all: true, verbatim: true });
      } catch {
        // Resolution failures are surfaced later by the actual request.
        addresses = [];
      }
      for (const entry of addresses) {
        const isPrivate =
          isIP(entry.address) === 4 ? isPrivateIpv4(entry.address) : isPrivateIpv6(entry.address);
        if (isAlwaysBlockedIp(entry.address) || isPrivate) {
          throw new TargetValidationError('Private network targets are disabled on this server.');
        }
      }
    }
  }

  return parsed;
}

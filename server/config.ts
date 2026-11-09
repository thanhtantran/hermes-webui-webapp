import path from 'path';

export interface AppConfig {
  isProduction: boolean;
  host: string;
  port: number;
  dataDir: string;
  googleClientId: string;
  encryptionKey: Buffer;
  allowedEmails: Set<string>;
  allowedEmailDomains: Set<string>;
  instanceHostAllowlist: string[];
  blockPrivateTargets: boolean;
  trustProxy: boolean;
  cookieSecure: 'auto' | 'always' | 'never';
  sessionTtlMs: number;
  proxyTimeoutMs: number;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and run "npm run keygen" to generate secrets.`
    );
  }
  return value;
}

function parseList(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseBool(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function parseTrustProxy(value: string | undefined): boolean {
  return parseBool(value);
}

function parseCookieSecure(value: string | undefined): 'auto' | 'always' | 'never' {
  const normalized = (value || 'auto').toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'always') return 'always';
  if (normalized === '0' || normalized === 'false' || normalized === 'never') return 'never';
  return 'auto';
}

function parseEncryptionKey(raw: string): Buffer {
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(
      'PASSWORD_ENC_KEY must be a base64-encoded 32-byte key. Run "npm run keygen" to generate one.'
    );
  }
  return key;
}

export function loadConfig(): AppConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return {
    isProduction,
    host: process.env.HOST?.trim() || '0.0.0.0',
    port,
    dataDir: path.resolve(process.env.DATA_DIR || './data'),
    googleClientId: required('GOOGLE_CLIENT_ID'),
    encryptionKey: parseEncryptionKey(required('PASSWORD_ENC_KEY')),
    allowedEmails: new Set(parseList(process.env.ALLOWED_EMAILS)),
    allowedEmailDomains: new Set(
      parseList(process.env.ALLOWED_EMAIL_DOMAINS).map((domain) => domain.replace(/^@/, ''))
    ),
    instanceHostAllowlist: parseList(process.env.INSTANCE_HOST_ALLOWLIST),
    blockPrivateTargets: parseBool(process.env.BLOCK_PRIVATE_TARGETS),
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
    cookieSecure: parseCookieSecure(process.env.COOKIE_SECURE),
    sessionTtlMs: 7 * 24 * 60 * 60 * 1000,
    proxyTimeoutMs: 60_000,
  };
}

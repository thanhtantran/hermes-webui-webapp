# Hermes WebUI Console — Feature Overview

## Authentication & accounts

- **Google sign-in** using Google Identity Services rendered in the app.
- **Server-side ID token verification** with `google-auth-library`; unverified
  emails are rejected.
- **Local account creation** on first sign-in (`users` table keyed by Google
  subject), with optional email/domain allowlists.
- **Opaque sessions** — 32-byte random tokens stored only as SHA-256 hashes in
  SQLite, delivered in an HttpOnly, SameSite=Lax cookie with a 7-day TTL and
  revoked on logout or expiry.
- **CSRF protection** — a per-session token is required in `X-CSRF-Token` for all
  state-changing requests, paired with same-origin checks.
- **Session-expiry handling** — a 401 clears the UI and returns to the login
  screen with a notice.

## Per-user instance management

- Add, edit, and delete Hermes endpoints; every query is scoped to the signed-in
  user.
- Cards show online/offline state, latency, saved-password status, notes, and
  quick actions (edit, delete, app window, open directly, connect).
- Duplicate URLs per user are rejected with a clear error.
- JSON export/import for migration; exported payloads never include passwords.

## Server-side credential storage

- Instance passwords are encrypted at rest with **AES-256-GCM**.
- The encryption key is supplied by `PASSWORD_ENC_KEY` (base64 32 bytes),
  generated with `npm run keygen`; it is never written to the database.
- Additional authenticated data binds each ciphertext to its instance ID.
- List/create/update responses expose only `hasPassword`; plaintext is returned
  only by the authenticated, rate-limited password-reveal endpoint.
- Editing without a new password keeps the stored one; an explicit empty value
  clears it.

## API security layer

- Central auth guard on all instance and proxy routes.
- Rate limits for authentication, general API traffic, and password reveals.
- Security headers (`nosniff`, `no-referrer`, `X-Frame-Options: DENY`,
  Permissions-Policy, HSTS when HTTPS) and disabled `x-powered-by`.
- JSON body limit of 256 KB; proxy body limit of 50 MB.
- Instance target validation: HTTP/HTTPS only, no embedded credentials, cloud
  metadata hosts always blocked, optional host allowlist and private-network
  blocking.
- Proxy requests are pinned to the registered instance origin at request time.

## Health monitoring

- Server-side HEAD probe with GET fallback, 4s/3s timeouts, and latency metrics.
- Automatic sweep when the console loads and every 30 seconds while the tab is
  visible.
- Manual single-instance refresh and "PING ALL".
- Live online/offline counts and last-sweep timestamp.

## Embedded viewer

- Frame-bypass proxy strips `X-Frame-Options` and CSP frame restrictions while
  applying `frame-ancestors 'self'`.
- HTML rewriting injects a `<base>` tag and routes `fetch`, `XMLHttpRequest`, and
  `EventSource` through the proxy.
- Target cookies are prefixed per instance and scoped to `/api/proxy`; the
  console session cookie is never forwarded.
- Toggle between proxy mode and the direct URL; launch in a separate app window
  or external tab.
- Mobile, tablet, and full-window viewport modes.

## Internationalization & theming

- English and Vietnamese dictionaries covering login, console, modals, and the
  viewer.
- Light and dark terminal-style themes persisted in `localStorage`.

## Runtime requirements

- Node.js 24+ (`node:sqlite`), Express 5, Vite 6, React 19, Tailwind CSS 4.
- SQLite data directory (`DATA_DIR`, default `./data`) must be backed up and
  protected.

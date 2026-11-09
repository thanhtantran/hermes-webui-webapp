# Hermes WebUI Console

An authenticated, multi-user web console for registering, monitoring, and opening
Hermes WebUI instances hosted on local machines or VPS servers. Each user signs
in with Google, and their instance list (including encrypted instance passwords)
is stored in a SQLite database on the console server.

> This project is a **console/manager**, not Hermes itself. It does not install,
> provision, or upgrade Hermes. You still need a running Hermes WebUI endpoint
> for every instance you register.

## Features

- **Google sign-in** — client-side Google Identity Services button, server-side
  ID token verification, and an automatically created local account per Google
  user.
- **Per-account instance registry** — every user sees and manages only their own
  Hermes instances.
- **Encrypted passwords at rest** — instance passwords are encrypted with
  AES-256-GCM using a key supplied through `PASSWORD_ENC_KEY`; plaintext is
  never returned by list endpoints.
- **Secure API layer** — HttpOnly session cookies, hashed opaque session tokens,
  per-session CSRF tokens, same-origin checks, rate limiting, and security
  headers.
- **Health monitoring** — server-side HEAD/GET probes, per-instance latency,
  periodic sweeps, and manual "ping all".
- **Embedded viewer** — the built-in proxy strips `X-Frame-Options`/CSP frame
  restrictions, rewrites HTML, and isolates target cookies from the console
  session.
- **JSON backup** — export/import instance endpoints (passwords are never
  exported).
- **English / Vietnamese UI** and light/dark themes.

## Requirements

- **Node.js 24 or newer** (the server uses the built-in `node:sqlite` module).
- A Google Cloud OAuth 2.0 **Web application** client ID.
- Network access from the console server to each Hermes instance.

## Google Cloud setup

1. Open [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
   and create an **OAuth client ID** of type **Web application**.
2. Under **Authorized JavaScript origins**, add every origin that serves this
   console, for example:
   - `http://localhost:3000` for local development
   - `https://console.example.com` for production
3. Copy the generated **Client ID** into `GOOGLE_CLIENT_ID`. No client secret is
   needed because only the ID token credential flow is used.

Google requires a secure context for sign-in in browsers: use `localhost` for
development and HTTPS in production.

## Setup

```bash
npm install
npm run keygen          # prints PASSWORD_ENC_KEY=<base64 32-byte key>
cp .env.example .env    # then fill in GOOGLE_CLIENT_ID and PASSWORD_ENC_KEY
npm run dev             # http://localhost:3000
```

Keep `PASSWORD_ENC_KEY` safe and backed up. If it is lost or changed, previously
stored instance passwords cannot be decrypted and must be re-entered.

## Production

```bash
npm run build   # typecheck + Vite production bundle into dist/
npm start       # NODE_ENV=production, serves dist/ and the API
```

Run behind a TLS-terminating reverse proxy (Caddy, Nginx, Traefik, etc.) and set:

```env
NODE_ENV=production
TRUST_PROXY=true
COOKIE_SECURE=always
```

The SQLite database lives in `DATA_DIR` (default `./data`). Back up that
directory and protect it like any credential store.

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | yes | — | OAuth Web client ID verified on the server. |
| `PASSWORD_ENC_KEY` | yes | — | Base64 32-byte AES-256-GCM key for instance passwords. |
| `HOST` | no | `0.0.0.0` | Listen address. |
| `PORT` | no | `3000` | Listen port. |
| `DATA_DIR` | no | `./data` | SQLite database directory. |
| `ALLOWED_EMAILS` | no | empty | Comma-separated exact emails allowed to sign in. |
| `ALLOWED_EMAIL_DOMAINS` | no | empty | Comma-separated email domains allowed to sign in. |
| `INSTANCE_HOST_ALLOWLIST` | no | empty | Comma-separated hostnames permitted as instance targets. |
| `BLOCK_PRIVATE_TARGETS` | no | `false` | Reject private/link-local target addresses (disables LAN instances). |
| `TRUST_PROXY` | no | `false` | Trust one reverse-proxy hop for IP/HTTPS detection. |
| `COOKIE_SECURE` | no | `auto` | `auto`, `always`, or `never` for the session cookie. |

If both `ALLOWED_EMAILS` and `ALLOWED_EMAIL_DOMAINS` are empty, any verified
Google account can create an account on this server. Set an allowlist for a
private deployment.

## Security model

- **Authentication** — Google ID tokens are verified against `GOOGLE_CLIENT_ID`;
  only verified emails are accepted. Sessions are opaque 32-byte random tokens
  stored as SHA-256 hashes, delivered in an HttpOnly, SameSite=Lax cookie with a
  7-day lifetime.
- **CSRF** — every state-changing API call requires the per-session
  `X-CSRF-Token` header, and auth/instance routes also check the request origin.
- **Ownership** — all instance queries are scoped by the authenticated user ID.
  Instance IDs belonging to another account return 404.
- **Passwords** — encrypted with AES-256-GCM and additional authenticated data
  bound to the instance ID. Decryption happens only inside the authenticated
  reveal endpoint. Plaintext passwords are never exported or listed.
- **Abuse resistance** — rate limits on auth, general API, and password-reveal
  routes; body-size limits; security headers; no `x-powered-by`.
- **Target validation** — only `http`/`https` endpoints are accepted, embedded
  credentials are rejected, and cloud metadata addresses are always blocked.
  Optional host allowlisting and private-address blocking are available.
- **Proxy isolation** — the console session cookie is never forwarded to
  targets. Target cookies are rewritten with an instance-specific prefix and
  scoped to `/api/proxy`. Hop-by-hop, encoding, frame, and CSP headers are
  stripped, and the response is limited to the instance's registered origin.

### Known limitations

- WebSocket upgrades are not proxied. Hermes features that rely on WebSockets
  may not work inside the embedded viewer; open the instance directly instead.
- Proxied pages are served from the console origin. A malicious or compromised
  Hermes instance could therefore run scripts with that origin's privileges.
  Only register instances you trust; for stronger isolation, host the console
  and the proxy on separate origins.
- The embedded viewer is best-effort. Some sites depend on features that cannot
  be proxied safely; use **Open directly** when that happens.

## Project structure

```
server.ts             HTTP server, middleware, dev/prod serving
server/auth.ts        Google sign-in, sessions, CSRF
server/db.ts          SQLite schema and queries (node:sqlite)
server/crypto.ts      AES-256-GCM, token hashing, timing-safe compare
server/target.ts      Target URL validation and SSRF controls
server/instances.ts   Per-user instance CRUD and health probes
server/proxy.ts       Frame-bypass proxy with cookie isolation
server/security.ts    Headers, origin checks, rate limiters
src/                  React 19 SPA (login, console, modal, viewer)
scripts/              Key generation helper
```

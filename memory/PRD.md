# Hermes WebUI Console — Product Requirements

## Overview

A self-hosted, multi-user web console for managing Hermes WebUI instances that run
on local machines or VPS servers. Users sign in with Google, and their instance
registry (URLs plus encrypted passwords) is stored on the console server in
SQLite. The console can monitor instance health and open an embedded viewer via a
frame-bypass proxy.

The product is a manager/proxy. It does not install, provision, or upgrade Hermes.

## Users and access

- Primary user: an operator who runs one or more Hermes instances and wants one
  place to manage, monitor, and open them.
- Accounts are created automatically on first Google sign-in (`users` keyed by
  Google subject).
- Deployments can restrict access with `ALLOWED_EMAILS` and/or
  `ALLOWED_EMAIL_DOMAINS`. Empty allowlists mean any verified Google account can
  register.

## Core requirements

1. Google sign-in using Google Identity Services; ID token verified server-side
   against `GOOGLE_CLIENT_ID`; verified emails only.
2. Server-side sessions: opaque tokens hashed in SQLite, HttpOnly SameSite=Lax
   cookie, 7-day TTL, logout revocation, CSRF token per session.
3. Per-user instance CRUD; cross-account access must return 404.
4. Instance passwords encrypted at rest with AES-256-GCM using
   `PASSWORD_ENC_KEY`; plaintext only via an authenticated reveal endpoint.
5. Server-side health probes with latency, periodic sweep, and manual refresh.
6. Frame-bypass proxy scoped to the registered instance origin, with target cookie
   isolation and without forwarding the console session cookie.
7. JSON export/import of instance endpoints without passwords.
8. English/Vietnamese UI and light/dark themes.

## Non-goals

- Installing or configuring Hermes on remote hosts.
- Sharing instances between accounts or team roles.
- WebSocket proxying.
- Mobile/native applications (removed in v2).

## Architecture

- `server.ts`: Express 5 server, middleware order, dev Vite middleware, production
  static `dist/`, graceful shutdown, hourly session cleanup.
- `server/auth.ts`: Google credential verification, sessions, CSRF.
- `server/db.ts`: `node:sqlite` schema (`users`, `sessions`, `instances`) with WAL
  and foreign keys.
- `server/crypto.ts`: AES-256-GCM, token generation/hashing, timing-safe compare.
- `server/target.ts`: URL normalization and SSRF controls.
- `server/instances.ts`: authenticated CRUD, import, ping, password reveal.
- `server/proxy.ts`: header stripping, redirect rewriting, HTML bootstrap, cookie
  isolation, streaming responses.
- `server/security.ts`: headers, origin checks, rate limiters.
- `src/`: React 19 SPA with a login gate, console, modals, and viewer.

## Key flows

1. **Sign-in**: GIS button returns an ID token → server verifies → upsert user →
   create session → return user + CSRF token.
2. **Add instance**: client validates form → server normalizes/allowlists URL →
   encrypts password → inserts row → returns DTO with `hasPassword`.
3. **Connect**: client asks server to mark `last_connected_at` → opens viewer with
   `/api/proxy?instanceId=...`.
4. **Reveal password**: authenticated POST with CSRF → decrypt with AAD → return
   plaintext with `Cache-Control: no-store`.

## Constraints and risks

- Requires Node.js 24+ (`node:sqlite`).
- Losing `PASSWORD_ENC_KEY` makes stored passwords unrecoverable.
- Proxied pages share the console origin, so only trusted instances should be
  registered; separate origins provide stronger isolation.
- WebSockets are not proxied; use the direct URL for features that need them.
- Google sign-in needs `localhost` or HTTPS.

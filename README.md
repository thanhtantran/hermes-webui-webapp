# Hermes Developer Console & WebUI Manager

A modern, tech-oriented developer console for managing and monitoring Hermes WebUI server instances (such as `https://hermes.orangepi.vn`) with an embedded X-Frame-Options bypass proxy, light/dark theme toggle, automated status pinging, Vietnamese language localization, and terminal-style typography.

## Features

### 1. Embedded X-Frame-Options & CSP Bypass Proxy
- Full-stack Express server (`server.ts`) proxying target Hermes server endpoints at `/api/proxy?url=...`.
- Strips restrictive `X-Frame-Options`, `Content-Security-Policy` (`frame-ancestors`), and related frame blocking headers.
- Injects `<base href="...">` into HTML responses so all relative stylesheets, scripts, fonts, and assets load seamlessly from the target server.
- Built-in toggle in the session viewer to switch between **Proxy Bypass Mode** (default) and **Direct Raw URL**.

### 2. Light / Dark Theme Switcher
- Instant toggle button in the top navigation bar (Sun / Moon icon).
- Tech-oriented aesthetic in both modes:
  - **Dark Console**: `#090d16` canvas with cyan and emerald neon accents.
  - **Light Console**: Crisp `#f8fafc` canvas with high-contrast slate text, subtle borders, and cyan/blue interactive highlights.
- Persists user theme preference in `localStorage`.

### 3. Live Server Status Check & Ping Health Monitor
- Server-side ping endpoint (`/api/ping?url=...`) for accurate, CORS-free connectivity checks with client fallback.
- Periodic polling every 30 seconds plus on-demand single re-ping and global **"PING ALL"** sweep.
- Real-time round-trip latency measurement (in milliseconds) and live status badges:
  - **Online** (emerald dot with response latency, e.g. `● ONLINE · 112ms` / `● TRỰC TUYẾN · 112ms`)
  - **Offline** (rose dot with connection failure details)
  - **Probing** (cyan spinner during network sweep)

### 4. Full Vietnamese & English Localization
- Instant `[ EN | VI ]` language toggle in the top bar.
- Comprehensive translation dictionary covering all headers, buttons, cards, dialogs, and session states.
- Persists language preference across browser sessions in `localStorage`.

### 5. Interactive Session Viewport & Device Simulation
- Switch between **Mobile Device View** (390px chassis), **Tablet View** (768px chassis), and **Full Window View**.
- Header controls: Console return, session reload, copy password, and direct launch in new tab.

### 6. Database Backup & Migration
- Export server registry to formatted JSON.
- Import and merge JSON configuration payloads.

## Development & Build

```bash
# Install dependencies
npm install

# Start full-stack server on port 3000
npm run dev

# Lint TypeScript
npm run lint

# Build production bundle
npm run build
```

# Hermes Developer Console & Server Health Monitor

A redesigned tech-oriented, terminal-styled interface for Hermes WebUI multi-server management, featuring real-time server health pinging, Vietnamese language localization, and a modern developer console aesthetic.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and design choices were confirmed in Phase 1:
> - **Visual Theme**: Modern dark developer console (deep slate canvas `#0b0f19` and `#111827`, dark structural surfaces, with sharp cyan `#06b6d4` and emerald `#10b981` accents).
> - **Server Status Ping**: Automated check on initial load with periodic background polling (every 30 seconds) plus a manual "Ping All" trigger with measured round-trip response time.
> - **Vietnamese Support**: Full English / Tiếng Việt localization toggle in the top bar with typography optimized for Vietnamese Unicode diacritics using Google Fonts *JetBrains Mono*.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the Hermes WebUI manager into a modern developer workstation. Users can monitor the live connectivity of their remote Hermes instances (with latency and online/offline status indicators), manage credentials, connect via the interactive device frame or new tab, and toggle between English and Vietnamese seamlessly.
- **Target Audience / Persona**: Engineers, home-lab enthusiasts, and developers running remote OrangePi / Raspberry Pi / SBC Hermes server instances.
- **Key Value**: Instant visibility into remote server availability before opening a session, combined with a high-efficiency developer terminal workflow that supports Vietnamese language naturally without breaking layout or diacritic accents.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Server Overview & Health Monitoring**:
   - On launch, all saved Hermes URLs are automatically pinged using asynchronous `HEAD` network probes with timeout control.
   - Each server card displays a live status badge: **Online** (emerald with round-trip latency, e.g. `128ms`), **Offline** (crimson with failure reason), or **Pinging** (cyan animated scanner).
   - A global toolbar provides a **"Ping All"** button with a timestamp of the last status sweep.
2. **Language Toggle**:
   - The top bar includes a segmented `[ EN | VI ]` toggle.
   - Switching language instantly updates all headers, modals, status labels, buttons, and empty states without page reloads.
3. **Connecting & Launching**:
   - Clicking **Connect** continues to open the dedicated instance viewer with device frame switching (Mobile 390px, Tablet 768px, Full View), 1-click password copy (`orangepi`), and direct browser launcher.
4. **Adding / Editing Servers**:
   - Tech-styled dialog with monospace inputs, URL syntax validator, password reveal toggle, and test demo server loader.

### Visual Identity & Theme
- **Aesthetic Direction**: Modern developer console — inspired by high-end CLI tools and developer telemetry interfaces. Clean, non-distracting, high information density.
- **Color Palette & Tokens**:
  - Dominant Canvas (60%): Slate 950 (`#090d16`) / Slate 900 (`#0f172a`)
  - Structural Surfaces (30%): Slate 850 (`#151f32`) with hairline border lines (`#1e293b` / `rgba(255,255,255,0.08)`)
  - Accent Budget (10%): Cyan 400 (`#22d3ee`) for focus/interactive triggers, Emerald 400 (`#34d399`) for online states & credentials, Crimson 400 (`#f87171`) for offline errors.
- **Typography**:
  - Primary Display & Data Font: **JetBrains Mono** loaded from Google Fonts (`family=JetBrains+Mono:wght@400;500;600;700&subset=vietnamese,latin,latin-ext`).
  - Strict tabular numbers (`tabular-nums`) for latencies, server counts, and port numbers.
- **Vietnamese Language Support**:
  - Full diacritic-safe rendering for Vietnamese vowel marks (dấu sắc, huyền, hỏi, ngã, nặng, mũ, móc) with balanced line-heights (`leading-relaxed`) to prevent clipping.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Server Ping Technique**
  - *Chosen Approach*: Lightweight asynchronous `fetch` with `mode: 'no-cors'`, `cache: 'no-store'`, and an `AbortController` (4s timeout).
  - *Why*: Browsers enforce CORS on external domains, which blocks reading response bodies from third-party Hermes servers. However, `mode: 'no-cors'` successfully detects network connectivity (resolving to an opaque response when the server responds on port 443/80, or rejecting if DNS fails / connection refused).
  - *Alternatives Considered*: Server-side proxy ping was rejected to preserve the pure client-side portability and privacy of user credentials.
- **Decision 2: Localization Architecture**
  - *Chosen Approach*: Type-safe translation dictionary (`src/utils/i18n.ts`) with a React `useTranslation` hook persisting language choice (`'en'` or `'vi'`) in `localStorage`.
  - *Why*: Fast, zero bundle bloat, zero external runtime dependency, and instantaneous language switching.
- **Decision 3: Terminal Font Integration**
  - *Chosen Approach*: Google Fonts link in `index.html` for `JetBrains Mono` with explicit `vietnamese` subset, configured as the primary monospaced family in Tailwind CSS.
  - *Why*: Guarantees crisp diacritic rendering across all operating systems without relying on system font fallbacks.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                       │
│  [ Hermes Console ] ──── [ EN | VI ] ──── [ + Add Server ]  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   Global Telemetry Toolbar                  │
│  [ Search / Filter ]  [ Ping All (Live) ]  [ Backup/JSON ]  │
└──────────────────────────────┬──────────────────────────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
┌─────────────▼──────────────┐   ┌──────────────▼─────────────┐
│        Server Card         │   │        Server Card         │
│  ● Online ~124ms (Emerald) │   │  ● Offline (Crimson)       │
│  Name: OrangePi Production │   │  Name: Local Staging       │
│  URL: https://...          │   │  URL: https://...          │
│  [Connect] [Edit] [Delete] │   │  [Connect] [Edit] [Delete] │
└────────────────────────────┘   └────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────────┐
│        WebView Viewport & Session Screen                    │
│  [ Device Frame: Mobile | Tablet | Full ] [ Copy Pass ]     │
│  [ Security Header Fallback & Direct Launch Helper ]        │
└─────────────────────────────────────────────────────────────┘
```

### State Model & New Properties
- `ServerStatus`: `'idle' | 'checking' | 'online' | 'offline'`
- `PingResult`: `{ status: ServerStatus, latencyMs?: number, lastCheckedAt?: number, error?: string }`
- Global Ping State map: `Record<string, PingResult>` indexed by server `id`.
- Polling timer: 30-second interval hook running smoothly in background when window is active.

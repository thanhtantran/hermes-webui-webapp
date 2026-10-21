# Hermes Mobile App - PRD

## Product Overview
Mobile app wrapping Hermes WebUI (https://hermes.orangepi.vn) for direct mobile access without a browser.

## Core Features

### 1. Multiple URL Management
- Add, edit, delete unlimited Hermes server URLs
- Each URL has: name, URL, optional saved password
- No default URL - user configures own instances
- Stored locally in AsyncStorage

### 2. Password-Only Credential Storage
- Hermes uses passwordless-only login (no username)
- Optional per-URL password save
- Password stored with URL in local storage
- Visual "Credentials saved" badge on URL cards

### 3. WebView + Auto-Login
- Native WebView loads selected Hermes URL
- JavaScript injection automatically:
  1. Finds `input[type="password"]` on page
  2. Fills saved password using native input setter (supports React/Vue controlled inputs)
  3. Dispatches input/change events
  4. Finds submit button (button[type="submit"], "Đăng nhập", "Login", etc.)
  5. Clicks button OR submits form OR presses Enter
- Polls up to 30 times (every 300ms) to handle SPAs
- Preserves cookies and third-party cookies for session

## Tech Stack
- React Native + Expo SDK 54
- expo-router (file-based nav)
- react-native-webview (with cookies, JS, dom storage enabled)
- expo-secure-store + AsyncStorage
- @expo/vector-icons

## App Structure
```
app/
├── _layout.tsx        # Root layout with icon fonts
├── index.tsx          # URL list + add/edit modal
└── webview.tsx        # WebView with auto-login injection
```

## Auto-Login Flow
1. User taps URL card → navigates to /webview
2. WebView loads Hermes URL
3. `injectedJavaScript` runs:
   - Polls for `input[type="password"]`
   - When found: sets value via native setter → dispatches events
   - After 300ms delay: clicks submit button
   - Fallbacks: form.submit() → Enter key press
4. User is logged in automatically

## Test Credentials
- URL: https://hermes.orangepi.vn
- Password: `orangepi`

## Testing Notes
- Storage doesn't persist on web preview (browser incognito behavior)
- Test on real device via Expo Go for full functionality
- Auto-login tested against actual Hermes form structure

## Removed Features (per user request)
- ❌ Voice recording (Hermes has this built-in)
- ❌ File browser/upload (Hermes has this built-in)
- ❌ Microphone permission
- ❌ Storage permission

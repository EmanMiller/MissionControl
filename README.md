# MissionControl

**AI-powered personal assistant and delivery engine.** One app, two modes: **Dev Mode** (plain English → code, branches, PRs) and **Creator Mode** (plain English → research, content, strategy, copy). Fire a request from your phone, live your life, come back to completed work.

---

## Status

- **Phase 1 (Core UI)** — In progress: iOS app shell, dark theme, bottom nav (Home, Tasks, Docs, Settings), task/feature cards for both modes.
- Creator Mode backend, Dev Mode backend, real-time build log, API key/setup, web version, Pro gating, and README demo to follow.

---

## Run the app (iOS)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start Expo and open iOS Simulator**
   ```bash
   npx expo start --ios
   ```
   Or run `npx expo start` and press `i` for iOS.

3. **First time:** Ensure Xcode and iOS Simulator are installed. Add `assets/icon.png` (and optionally `assets/adaptive-icon.png`) for a custom app icon.

---

## Design system (dark only)

| Token        | Value     |
|-------------|-----------|
| Background  | `#0A0A0A` |
| Surface     | `#111111` / `#1A1A1A` |
| Border      | `#2A2A2A` |
| Primary     | `#06B6D4` (cyan) |
| Text        | `#F9FAFB` / `#9CA3AF` |
| Success     | `#10B981` |
| In progress | `#F59E0B` |
| Error       | `#EF4444` |

Fonts: Inter for UI, JetBrains Mono for build log/code (custom fonts can be added later).

---

## Tech stack

- **iOS:** React Native (Expo), TypeScript, Expo Router (file-based), bottom tabs.
- **Backend (planned):** Python (FastAPI), Redis + Celery, Anthropic API, GitHub API, WebSockets.
- **Web (planned):** React, Docker.

---

## License

Proprietary. See repo for details.

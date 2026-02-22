# MissionControl

**AI-powered personal assistant and delivery engine.** Fire a request in plain English, live your life, come back to completed work.

Two modes:
- **Dev Mode** — plain English → code, branches, PRs
- **Creator Mode** — plain English → research, content, strategy, copy

---

## Status

**Phase 1 (Core UI) — Complete**
- Dark-themed web app shell
- Kanban board with drag-and-drop task management
- Ideas capture board → task queue
- Approvals flow (review what was built before it ships)
- Outputs library and History timeline
- Onboarding flow with OAuth sign-in (Google, GitHub, Apple)
- Settings: API key management, mode switching, notifications

**Coming next:** AI backends (FastAPI + Celery), real-time build log, WebSocket updates, Pro gating, mobile app.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/EmanMiller/MissionControl.git
cd MissionControl

# 2. Install
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in your OAuth credentials in .env.local

# 4. Run
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID ([console.cloud.google.com](https://console.cloud.google.com)) |
| `VITE_APPLE_CLIENT_ID` | Apple Sign In service ID ([developer.apple.com](https://developer.apple.com)) |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth app client ID ([github.com/settings/developers](https://github.com/settings/developers)) |

`.env.local` is gitignored — your credentials will never be committed.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, TypeScript |
| Icons | Lucide React |
| Auth | Google OAuth (`@react-oauth/google`), GitHub OAuth, Apple Sign In |
| Backend *(planned)* | Python, FastAPI, Redis, Celery, Anthropic API, GitHub API |
| Realtime *(planned)* | WebSockets |

---

## Design System (dark only)

| Token | Value |
|---|---|
| Background | `#0A0A0A` |
| Surface | `#111111` / `#1A1A1A` |
| Border | `#2A2A2A` |
| Primary | `#06B6D4` (cyan) |
| Text | `#F9FAFB` / `#9CA3AF` |
| Success | `#10B981` |
| In Progress | `#F59E0B` |
| Error | `#EF4444` |

Fonts: Inter (UI), JetBrains Mono (build log / code).

---

## Contributing

PRs welcome. Open an issue first for anything significant.

1. Fork → branch → PR
2. Keep the dark-only design system intact
3. No hardcoded credentials — use `.env.local`

---

## License

MIT — see [LICENSE](./LICENSE).

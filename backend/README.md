# MissionControl Backend

FastAPI + SQLite backend for MissionControl.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

## Migrations (optional — tables auto-create on startup)

```bash
alembic upgrade head
```

## WebSocket

Connect to `ws://localhost:8000/ws` to receive real-time task updates:

```json
{"event": "task_updated", "task": {...}}
```

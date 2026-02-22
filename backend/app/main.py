from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func

from app.config import settings
from app.database import engine, AsyncSessionLocal, Base
from app.models import Task, Idea, Approval, Output, HistoryEntry
from app.routers import tasks, ideas, approvals, outputs, history, ws


# ── Seed helpers ─────────────────────────────────────────────────────────────

def _dt(days_ago: int, hour: int, minute: int) -> datetime:
    base = datetime.now(timezone.utc).replace(hour=hour, minute=minute, second=0, microsecond=0)
    return base - timedelta(days=days_ago)


async def _seed(db) -> None:
    # Skip if tasks already exist
    count = await db.scalar(select(func.count()).select_from(Task))
    if count and count > 0:
        return

    # Tasks
    tasks_data = [
        Task(text="Make it so that I can access the content ideas from the content coach. so i can ask questions and content coach can go through all my saved ideas", status="Backlog", type="Feature", created_at=_dt(2, 11, 5), updated_at=_dt(2, 11, 5)),
        Task(text="have voice transcription in the brain dump so i can hit a button and start talking into my microphone", status="New", type="Feature", created_at=_dt(2, 10, 24), updated_at=_dt(2, 10, 24)),
        Task(text="Add a tab to 'History' that lets me see all of my content ideas from 'compose ideas'", status="Built", type="Feature", created_at=_dt(2, 10, 23), updated_at=_dt(2, 10, 23)),
        Task(text="I want to be able to see the make me a banger history", status="Backlog", type="Feature", created_at=_dt(2, 9, 38), updated_at=_dt(2, 9, 38)),
    ]
    for t in tasks_data:
        db.add(t)
    await db.flush()

    # Ideas
    ideas_data = [
        Idea(text="Build a tool that converts my voice notes into structured blog posts automatically", created_at=_dt(3, 9, 12)),
        Idea(text="Research the top 10 Shopify apps for creators and summarize what's missing in the market", created_at=_dt(4, 15, 45)),
        Idea(text="Create a landing page for my beat selling business with a dark theme and fire aesthetic", created_at=_dt(5, 11, 0)),
    ]
    for i in ideas_data:
        db.add(i)

    # Approvals (linked to built task, id=3 will be tasks_data[2])
    built_task = tasks_data[2]
    approvals_data = [
        Approval(
            task_id=built_task.id,
            task_text="Add a voice transcription button to the brain dump screen",
            what_was_built="Added a microphone button to the top-right of the Brain Dump screen. Clicking it starts recording. Speech is transcribed using the Web Speech API and inserted into the text field automatically. Works on Chrome and Safari.",
            status="pending",
            created_at=_dt(2, 10, 43),
        ),
        Approval(
            task_id=built_task.id,
            task_text="Create a history tab showing all my past content ideas",
            what_was_built="Created a new History tab in the main navigation. It pulls all previously saved ideas from local storage and displays them in a searchable, scrollable list sorted by date.",
            status="pending",
            created_at=_dt(2, 9, 15),
        ),
    ]
    for a in approvals_data:
        db.add(a)

    # Outputs
    outputs_data = [
        Output(type="Code",     title="History Tab Component",                     description="React component for browsing saved content ideas",              created_at=_dt(2, 10, 43)),
        Output(type="Research", title="Top Shopify Apps for Creators — Market Gap", description="10 apps analyzed, 3 market gaps identified",                   created_at=_dt(3, 16, 0)),
        Output(type="Content",  title="Instagram Caption Pack — 7 posts",           description="Captions for beat drop, studio session, collab announcement",   created_at=_dt(4, 12, 0)),
        Output(type="Code",     title="Voice Transcription Feature",                description="Microphone button + Web Speech API integration",                created_at=_dt(5, 14, 0)),
        Output(type="Docs",     title="Business Plan — Beat Selling Platform",      description="Market analysis, revenue model, go-to-market strategy",         created_at=_dt(6, 10, 0)),
        Output(type="Content",  title="Brand Copy — Landing Page",                  description="Hero headline, subheadline, CTA, and about section",            created_at=_dt(7, 9, 0)),
    ]
    for o in outputs_data:
        db.add(o)

    # History entries
    history_data = [
        HistoryEntry(task_id=built_task.id, event="History tab with compose ideas",  status="Built",     created_at=_dt(2, 10, 43)),
        HistoryEntry(task_id=built_task.id, event="Voice transcription button",      status="Built",     created_at=_dt(2, 9, 15)),
        HistoryEntry(task_id=None,          event="Shopify market research report",  status="Generated", created_at=_dt(3, 16, 30)),
        HistoryEntry(task_id=None,          event="Dark mode toggle for settings",   status="Built",     created_at=_dt(3, 14, 0)),
        HistoryEntry(task_id=None,          event="Instagram caption pack",          status="Generated", created_at=_dt(4, 11, 0)),
    ]
    for h in history_data:
        db.add(h)

    await db.commit()


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as db:
        await _seed(db)
    yield


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="MissionControl API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(ideas.router)
app.include_router(approvals.router)
app.include_router(outputs.router)
app.include_router(history.router)
app.include_router(ws.router)


@app.get("/health")
async def health():
    return {"status": "ok"}

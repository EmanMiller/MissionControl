from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import HistoryEntry


async def get_history(db: AsyncSession) -> list[HistoryEntry]:
    result = await db.execute(select(HistoryEntry).order_by(HistoryEntry.created_at.desc()))
    return list(result.scalars().all())


async def add_history(db: AsyncSession, task_id: int | None, event: str, status: str) -> HistoryEntry:
    entry = HistoryEntry(task_id=task_id, event=event, status=status)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry

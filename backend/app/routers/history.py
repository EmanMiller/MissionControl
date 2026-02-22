from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import HistoryEntryOut
from app.services.history_service import get_history

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[HistoryEntryOut])
async def list_history(db: AsyncSession = Depends(get_db)):
    return await get_history(db)

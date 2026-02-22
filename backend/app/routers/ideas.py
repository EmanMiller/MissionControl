from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Idea
from app.schemas import IdeaCreate, IdeaOut

router = APIRouter(prefix="/api/ideas", tags=["ideas"])


@router.get("", response_model=list[IdeaOut])
async def list_ideas(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Idea).order_by(Idea.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=IdeaOut, status_code=201)
async def create_idea(data: IdeaCreate, db: AsyncSession = Depends(get_db)):
    idea = Idea(text=data.text)
    db.add(idea)
    await db.commit()
    await db.refresh(idea)
    return idea


@router.delete("/{idea_id}", status_code=204)
async def delete_idea(idea_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Idea).where(Idea.id == idea_id))
    idea = result.scalar_one_or_none()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    await db.delete(idea)
    await db.commit()

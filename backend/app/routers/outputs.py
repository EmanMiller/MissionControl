from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Output
from app.schemas import OutputCreate, OutputOut

router = APIRouter(prefix="/api/outputs", tags=["outputs"])


@router.get("", response_model=list[OutputOut])
async def list_outputs(
    type: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Output).order_by(Output.created_at.desc())
    if type:
        stmt = stmt.where(Output.type == type)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=OutputOut, status_code=201)
async def create_output(data: OutputCreate, db: AsyncSession = Depends(get_db)):
    output = Output(**data.model_dump())
    db.add(output)
    await db.commit()
    await db.refresh(output)
    return output

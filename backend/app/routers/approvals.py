from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Approval
from app.schemas import ApprovalCreate, ApprovalOut

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


@router.get("", response_model=list[ApprovalOut])
async def list_approvals(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Approval)
        .where(Approval.status == "pending")
        .order_by(Approval.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=ApprovalOut, status_code=201)
async def create_approval(data: ApprovalCreate, db: AsyncSession = Depends(get_db)):
    approval = Approval(**data.model_dump())
    db.add(approval)
    await db.commit()
    await db.refresh(approval)
    return approval


@router.post("/{approval_id}/approve", response_model=ApprovalOut)
async def approve(approval_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Approval).where(Approval.id == approval_id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = "approved"
    await db.commit()
    await db.refresh(approval)
    return approval


@router.post("/{approval_id}/reject", response_model=ApprovalOut)
async def reject(approval_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Approval).where(Approval.id == approval_id))
    approval = result.scalar_one_or_none()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = "rejected"
    await db.commit()
    await db.refresh(approval)
    return approval

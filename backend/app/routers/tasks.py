from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import TaskCreate, TaskUpdate, TaskOut
from app.services import task_service
from app.services.history_service import add_history
from app.routers.ws import broadcast

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskOut])
async def list_tasks(db: AsyncSession = Depends(get_db)):
    return await task_service.get_tasks(db)


@router.post("", response_model=TaskOut, status_code=201)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = await task_service.create_task(db, data)
    await add_history(db, task.id, f"Task created: {task.text[:60]}", "New")
    return task


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task = await task_service.update_task(db, task, data)
    await add_history(db, task.id, f"Status changed to {task.status}", task.status)
    task_out = TaskOut.model_validate(task)
    await broadcast({"event": "task_updated", "task": task_out.model_dump(mode="json")})
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db)):
    task = await task_service.get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await task_service.delete_task(db, task)

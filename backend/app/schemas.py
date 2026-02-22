from datetime import datetime
from typing import Literal
from pydantic import BaseModel


# ── Task ──────────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    text: str
    status: Literal["Backlog", "New", "In Progress", "Built"] = "Backlog"
    type: str = "Feature"


class TaskUpdate(BaseModel):
    text: str | None = None
    status: Literal["Backlog", "New", "In Progress", "Built"] | None = None
    type: str | None = None


class TaskOut(BaseModel):
    id: int
    text: str
    status: str
    type: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Idea ──────────────────────────────────────────────────────────────────────

class IdeaCreate(BaseModel):
    text: str


class IdeaOut(BaseModel):
    id: int
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Approval ──────────────────────────────────────────────────────────────────

class ApprovalCreate(BaseModel):
    task_id: int | None = None
    task_text: str
    what_was_built: str
    status: Literal["pending", "approved", "rejected"] = "pending"


class ApprovalOut(BaseModel):
    id: int
    task_id: int | None
    task_text: str
    what_was_built: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Output ────────────────────────────────────────────────────────────────────

class OutputCreate(BaseModel):
    type: Literal["Code", "Research", "Content", "Docs"]
    title: str
    description: str = ""
    task_id: int | None = None


class OutputOut(BaseModel):
    id: int
    type: str
    title: str
    description: str
    task_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── History ───────────────────────────────────────────────────────────────────

class HistoryEntryOut(BaseModel):
    id: int
    task_id: int | None
    event: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

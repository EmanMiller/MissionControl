"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-22

"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="Backlog"),
        sa.Column("type", sa.String(32), nullable=False, server_default="Feature"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "ideas",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "approvals",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("task_id", sa.Integer, sa.ForeignKey("tasks.id"), nullable=True),
        sa.Column("task_text", sa.Text, nullable=False),
        sa.Column("what_was_built", sa.Text, nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "outputs",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("type", sa.String(32), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=False, server_default=""),
        sa.Column("task_id", sa.Integer, sa.ForeignKey("tasks.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "history",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("task_id", sa.Integer, sa.ForeignKey("tasks.id"), nullable=True),
        sa.Column("event", sa.Text, nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="Built"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("history")
    op.drop_table("outputs")
    op.drop_table("approvals")
    op.drop_table("ideas")
    op.drop_table("tasks")

"""mysql: create/update interviews table

Revision ID: 0010_interviews
Revises: 0009_app_status_hist
Create Date: 2026-02-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import func

import sqlalchemy as sa

def _insp(bind):
    return sa.inspect(bind)

def table_exists(bind, table_name: str) -> bool:
    return table_name in _insp(bind).get_table_names()

def column_exists(bind, table_name: str, column_name: str) -> bool:
    return any(c["name"] == column_name for c in _insp(bind).get_columns(table_name))

def index_exists(bind, table_name: str, index_name: str) -> bool:
    return any(i.get("name") == index_name for i in _insp(bind).get_indexes(table_name))

def unique_constraint_exists(bind, table_name: str, constraint_name: str) -> bool:
    return any(u.get("name") == constraint_name for u in _insp(bind).get_unique_constraints(table_name))


revision = "0010_interviews"
down_revision = '0009_app_status_hist'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    interviewmode = sa.Enum("PHONE","VIDEO","IN_PERSON","TECHNICAL_TEST", name="interviewmode")
    interviewstatus = sa.Enum("SCHEDULED","COMPLETED","CANCELLED","RESCHEDULED","NO_SHOW", name="interviewstatus")
    interviewresult = sa.Enum("SELECTED","REJECTED","ON_HOLD","PENDING", name="interviewresult")

    if not table_exists(bind, "interviews"):
        op.create_table(
            "interviews",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id"), nullable=False),
            sa.Column("round_number", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("round_name", sa.String(100), nullable=False),
            sa.Column("scheduled_date", sa.DateTime(timezone=True)),
            sa.Column("duration_minutes", sa.Integer(), server_default="60"),
            sa.Column("interviewer_name", sa.String(255)),
            sa.Column("interviewer_email", sa.String(255)),
            sa.Column("interviewer_designation", sa.String(100)),
            sa.Column("is_client_interview", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("interview_mode", interviewmode, nullable=False, server_default="VIDEO"),
            sa.Column("meeting_link", sa.String(500)),
            sa.Column("location", sa.String(255)),
            sa.Column("status", interviewstatus, nullable=False, server_default="SCHEDULED"),
            sa.Column("feedback", sa.Text()),
            sa.Column("rating", sa.Integer()),
            sa.Column("strengths", sa.Text()),
            sa.Column("weaknesses", sa.Text()),
            sa.Column("result", interviewresult, server_default="PENDING"),
            sa.Column("next_round_scheduled", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("additional_notes", sa.Text()),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("completed_at", sa.DateTime(timezone=True)),
        )

    if not index_exists(bind, "interviews", "ix_interviews_application_id"):
        op.create_index("ix_interviews_application_id", "interviews", ["application_id"])

def downgrade():
    pass

"""mysql: create/update application_status_history table

Revision ID: 0009_app_status_hist
Revises: 0008_applications
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


revision = "0009_app_status_hist"
down_revision = '0008_applications'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()

    if not table_exists(bind, "application_status_history"):
        op.create_table(
            "application_status_history",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id"), nullable=False),
            sa.Column("from_status", sa.String(50)),
            sa.Column("to_status", sa.String(50), nullable=False),
            sa.Column("changed_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("notes", sa.Text()),
            sa.Column("changed_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        )

    if not index_exists(bind, "application_status_history", "ix_application_status_history_application_id"):
        op.create_index("ix_application_status_history_application_id", "application_status_history", ["application_id"])

def downgrade():
    pass

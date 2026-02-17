"""mysql: create/update joinings table

Revision ID: 0012_joinings
Revises: 0011_offers
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


revision = "0012_joinings"
down_revision = '0011_offers'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    joiningstatus = sa.Enum("CONFIRMED","NO_SHOW","DELAYED","REPLACEMENT_REQUIRED", name="joiningstatus")

    if not table_exists(bind, "joinings"):
        op.create_table(
            "joinings",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id"), nullable=False, unique=True),
            sa.Column("offer_id", sa.Integer(), sa.ForeignKey("offers.id"), nullable=False),
            sa.Column("actual_joining_date", sa.Date()),
            sa.Column("expected_joining_date", sa.Date()),
            sa.Column("employee_id", sa.String(100)),
            sa.Column("work_email", sa.String(255)),
            sa.Column("reporting_manager", sa.String(255)),
            sa.Column("status", joiningstatus, nullable=False, server_default="CONFIRMED"),
            sa.Column("bgv_status", sa.String(50), nullable=True, server_default=""),
            sa.Column("no_show_reason", sa.Text()),
            sa.Column("no_show_date", sa.Date()),
            sa.Column("replacement_window_days", sa.Integer(), server_default="30"),
            sa.Column("replacement_initiated", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("replacement_application_id", sa.Integer(), sa.ForeignKey("applications.id")),
            sa.Column("documents_collected", sa.JSON()),
            sa.Column("onboarding_status", sa.JSON()),
            sa.Column("notes", sa.Text()),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
        )
    else:
        # Add missing column(s) without dropping data
        if not column_exists(bind, "joinings", "bgv_status"):
            op.add_column("joinings", sa.Column("bgv_status", sa.String(50), nullable=True, server_default=""))

    if not index_exists(bind, "joinings", "ix_joinings_offer_id"):
        op.create_index("ix_joinings_offer_id", "joinings", ["offer_id"])

def downgrade():
    pass

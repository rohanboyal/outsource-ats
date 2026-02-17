"""mysql: create/update clients table

Revision ID: 0003_clients_upsert_schema
Revises: 0002_users_upsert_schema
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


revision = "0003_clients_upsert_schema"
down_revision = '0002_users_upsert_schema'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    clientstatus = sa.Enum("PROSPECT","ACTIVE","INACTIVE", name="clientstatus")

    if not table_exists(bind, "clients"):
        op.create_table(
            "clients",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("company_name", sa.String(255), nullable=False),
            sa.Column("industry", sa.String(100)),
            sa.Column("website", sa.String(255)),
            sa.Column("address", sa.Text()),
            sa.Column("status", clientstatus, nullable=False, server_default="PROSPECT"),
            sa.Column("account_manager_id", sa.Integer(), sa.ForeignKey("users.id")),
            sa.Column("default_sla_days", sa.Integer(), server_default="7"),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("deleted_at", sa.DateTime(timezone=True)),
        )

    for idx_name, cols in [
        ("ix_clients_company_name", ["company_name"]),
        ("ix_clients_status", ["status"]),
        ("ix_clients_account_manager_id", ["account_manager_id"]),
    ]:
        if not index_exists(bind, "clients", idx_name):
            op.create_index(idx_name, "clients", cols)

def downgrade():
    pass

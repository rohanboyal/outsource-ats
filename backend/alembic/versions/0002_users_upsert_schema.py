"""mysql: create/update users table

Revision ID: 0002_users_upsert_schema
Revises: 0001_mysql_enum_note
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


revision = "0002_users_upsert_schema"
down_revision = "0001_mysql_enum_note"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()

    # ✅ Match your legacy DB enum values (CAPS)
    # Keep name="userrole" for consistency (MySQL stores ENUM at column-level anyway)
    userrole = sa.Enum(
        "ADMIN",
        "RECRUITER",
        "ACCOUNT_MANAGER",
        "BD_SALES",
        "FINANCE",
        "CLIENT",
        name="userrole",
    )

    if not table_exists(bind, "users"):
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("hashed_password", sa.String(255), nullable=False),
            sa.Column("full_name", sa.String(255), nullable=False),
            sa.Column("phone", sa.String(20)),
            sa.Column("role", userrole, nullable=False, server_default="RECRUITER"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("last_login", sa.DateTime(timezone=True)),
            sa.Column("deleted_at", sa.DateTime(timezone=True)),
        )
    else:
        # Ensure missing columns exist
        additions = [
            ("phone", sa.Column("phone", sa.String(20), nullable=True)),
            ("is_active", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1"))),
            ("is_verified", sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("0"))),
            ("created_at", sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now())),
            ("updated_at", sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now())),
            ("last_login", sa.Column("last_login", sa.DateTime(timezone=True), nullable=True)),
            ("deleted_at", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True)),
        ]
        for col_name, col in additions:
            if not column_exists(bind, "users", col_name):
                op.add_column("users", col)

        # ✅ Key fix: if role column exists, make sure its ENUM has all legacy values.
        # Using raw SQL is the most reliable way in MySQL.
        if column_exists(bind, "users", "role"):
            op.execute(
                "ALTER TABLE users MODIFY COLUMN role "
                "ENUM('ADMIN','RECRUITER','ACCOUNT_MANAGER','BD_SALES','FINANCE','CLIENT') "
                "NOT NULL DEFAULT 'RECRUITER'"
            )
        else:
            op.add_column("users", sa.Column("role", userrole, nullable=False, server_default="RECRUITER"))

    # Indexes/constraints
    if not index_exists(bind, "users", "ix_users_email"):
        op.create_index("ix_users_email", "users", ["email"])
    if not unique_constraint_exists(bind, "users", "uq_users_email"):
        op.create_unique_constraint("uq_users_email", "users", ["email"])


def downgrade():
    pass

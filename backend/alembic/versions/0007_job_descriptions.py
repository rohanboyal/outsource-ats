"""mysql: create/update job_descriptions table

Revision ID: 0007_job_descriptions
Revises: 0006_pitches
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


revision = "0007_job_descriptions"
down_revision = '0006_pitches'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    contracttype = sa.Enum("FULL_TIME","CONTRACT","PART_TIME","TEMP_TO_PERM", name="contracttype")
    jdstatus = sa.Enum("DRAFT","OPEN","ON_HOLD","CLOSED", name="jdstatus")
    jdpriority = sa.Enum("LOW","MEDIUM","HIGH","URGENT", name="jdpriority")

    if not table_exists(bind, "job_descriptions"):
        op.create_table(
            "job_descriptions",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("client_id", sa.Integer(), sa.ForeignKey("clients.id"), nullable=False),
            sa.Column("pitch_id", sa.Integer(), sa.ForeignKey("pitches.id")),
            sa.Column("assigned_recruiter_id", sa.Integer(), sa.ForeignKey("users.id")),
            sa.Column("jd_code", sa.String(50), nullable=False),
            sa.Column("title", sa.String(255), nullable=False),
            sa.Column("description", sa.Text(), nullable=False),
            sa.Column("required_skills", sa.JSON()),
            sa.Column("preferred_skills", sa.JSON()),
            sa.Column("experience_min", sa.Float()),
            sa.Column("experience_max", sa.Float()),
            sa.Column("location", sa.String(255)),
            sa.Column("work_mode", sa.String(50)),
            sa.Column("contract_type", contracttype, nullable=False, server_default="FULL_TIME"),
            sa.Column("open_positions", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("filled_positions", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("status", jdstatus, nullable=False, server_default="DRAFT"),
            sa.Column("priority", jdpriority, nullable=False, server_default="MEDIUM"),
            sa.Column("sla_days", sa.Integer(), server_default="7"),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("parent_jd_id", sa.Integer(), sa.ForeignKey("job_descriptions.id")),
            sa.Column("budget_min", sa.Float()),
            sa.Column("budget_max", sa.Float()),
            sa.Column("currency", sa.String(10), server_default="USD"),
            sa.Column("benefits", sa.Text()),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("deleted_at", sa.DateTime(timezone=True)),
        )

    if not index_exists(bind, "job_descriptions", "ix_job_descriptions_jd_code"):
        op.create_index("ix_job_descriptions_jd_code", "job_descriptions", ["jd_code"])
    if not unique_constraint_exists(bind, "job_descriptions", "uq_job_descriptions_jd_code"):
        op.create_unique_constraint("uq_job_descriptions_jd_code", "job_descriptions", ["jd_code"])

def downgrade():
    pass

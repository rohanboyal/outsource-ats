"""mysql: create/update applications table

Revision ID: 0008_applications
Revises: 0007_job_descriptions
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


revision = "0008_applications"
down_revision = '0007_job_descriptions'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    applicationstatus = sa.Enum("SOURCED","SCREENED","SUBMITTED","INTERVIEWING","OFFERED","JOINED","REJECTED","WITHDRAWN", name="applicationstatus")
    slastatus = sa.Enum("ON_TRACK","AT_RISK","BREACHED", name="slastatus")

    if not table_exists(bind, "applications"):
        op.create_table(
            "applications",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("candidate_id", sa.Integer(), sa.ForeignKey("candidates.id"), nullable=False),
            sa.Column("jd_id", sa.Integer(), sa.ForeignKey("job_descriptions.id"), nullable=False),
            sa.Column("status", applicationstatus, nullable=False, server_default="SOURCED"),
            sa.Column("substatus", sa.String(100)),
            sa.Column("screening_notes", sa.Text()),
            sa.Column("internal_rating", sa.Integer()),
            sa.Column("screened_by", sa.Integer(), sa.ForeignKey("users.id")),
            sa.Column("screened_at", sa.DateTime(timezone=True)),
            sa.Column("submitted_to_client_date", sa.Date()),
            sa.Column("client_submission_notes", sa.Text()),
            sa.Column("sla_start_date", sa.Date()),
            sa.Column("sla_end_date", sa.Date()),
            sa.Column("sla_status", slastatus, server_default="ON_TRACK"),
            sa.Column("rejection_reason", sa.Text()),
            sa.Column("rejection_stage", sa.String(50)),
            sa.Column("rejected_by", sa.String(100)),
            sa.Column("rejected_at", sa.DateTime(timezone=True)),
            sa.Column("withdrawal_reason", sa.Text()),
            sa.Column("withdrawn_at", sa.DateTime(timezone=True)),
            sa.Column("notes", sa.Text()),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("deleted_at", sa.DateTime(timezone=True)),
        )

    for idx_name, cols in [
        ("ix_applications_candidate_id", ["candidate_id"]),
        ("ix_applications_jd_id", ["jd_id"]),
        ("ix_applications_status", ["status"]),
        ("ix_applications_submitted_to_client_date", ["submitted_to_client_date"]),
    ]:
        if not index_exists(bind, "applications", idx_name):
            op.create_index(idx_name, "applications", cols)

def downgrade():
    pass

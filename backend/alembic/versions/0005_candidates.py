"""mysql: create/update candidates table

Revision ID: 0005_candidates
Revises: 0004_client_contacts
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


revision = "0005_candidates"
down_revision = '0004_client_contacts'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    candidatesource = sa.Enum("PORTAL","REFERRAL","DIRECT","VENDOR","LINKEDIN","INDEED","NAUKRI","OTHER", name="candidatesource")

    if not table_exists(bind, "candidates"):
        op.create_table(
            "candidates",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("first_name", sa.String(100), nullable=False),
            sa.Column("last_name", sa.String(100), nullable=False),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("phone", sa.String(20)),
            sa.Column("alternate_phone", sa.String(20)),
            sa.Column("current_company", sa.String(255)),
            sa.Column("current_designation", sa.String(255)),
            sa.Column("total_experience", sa.Float()),
            sa.Column("relevant_experience", sa.Float()),
            sa.Column("skills", sa.JSON()),
            sa.Column("certifications", sa.JSON()),
            sa.Column("resume_path", sa.String(500)),
            sa.Column("resume_original_name", sa.String(255)),
            sa.Column("resume_parsed_data", sa.JSON()),
            sa.Column("current_location", sa.String(255)),
            sa.Column("preferred_locations", sa.JSON()),
            sa.Column("willing_to_relocate", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("notice_period_days", sa.Integer()),
            sa.Column("availability_date", sa.DateTime(timezone=True)),
            sa.Column("serving_notice_period", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("current_ctc", sa.Float()),
            sa.Column("expected_ctc", sa.Float()),
            sa.Column("currency", sa.String(10), server_default="USD"),
            sa.Column("source", candidatesource, nullable=False, server_default="DIRECT"),
            sa.Column("source_details", sa.String(255)),
            sa.Column("linkedin_url", sa.String(500)),
            sa.Column("github_url", sa.String(500)),
            sa.Column("portfolio_url", sa.String(500)),
            sa.Column("highest_education", sa.String(100)),
            sa.Column("education_details", sa.JSON()),
            sa.Column("notes", sa.Text()),
            sa.Column("tags", sa.JSON()),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("deleted_at", sa.DateTime(timezone=True)),
        )

    if not index_exists(bind, "candidates", "ix_candidates_email"):
        op.create_index("ix_candidates_email", "candidates", ["email"])
    if not unique_constraint_exists(bind, "candidates", "uq_candidates_email"):
        op.create_unique_constraint("uq_candidates_email", "candidates", ["email"])

def downgrade():
    pass

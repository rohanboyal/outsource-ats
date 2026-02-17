"""mysql: create/update offers table (model aligned)

Revision ID: 0011_offers
Revises: 0010_interviews
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


revision = "0011_offers"
down_revision = '0010_interviews'
branch_labels = None
depends_on = None

def upgrade():
    bind = op.get_bind()
    offerstatus = sa.Enum("DRAFT","SENT","NEGOTIATING","ACCEPTED","DECLINED","CANCELLED","EXPIRED", name="offerstatus")

    if not table_exists(bind, "offers"):
        op.create_table(
            "offers",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("application_id", sa.Integer(), sa.ForeignKey("applications.id"), nullable=False),
            sa.Column("offer_number", sa.String(50), nullable=False),
            sa.Column("designation", sa.String(255), nullable=False),
            sa.Column("department", sa.String(100)),
            sa.Column("ctc_annual", sa.Float(), nullable=False),
            sa.Column("fixed_component", sa.Float()),
            sa.Column("variable_component", sa.Float()),
            sa.Column("currency", sa.String(10), nullable=False, server_default="USD"),
            sa.Column("other_benefits", sa.JSON()),
            sa.Column("joining_date_proposed", sa.Date()),
            sa.Column("offer_valid_till", sa.Date()),
            sa.Column("status", offerstatus, nullable=False, server_default="DRAFT"),
            sa.Column("revision_number", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("parent_offer_id", sa.Integer(), sa.ForeignKey("offers.id")),
            sa.Column("acceptance_date", sa.Date()),
            sa.Column("decline_reason", sa.Text()),
            sa.Column("offer_letter_path", sa.String(500)),
            sa.Column("negotiation_notes", sa.Text()),
            sa.Column("requires_approval", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("approved_by", sa.Integer(), sa.ForeignKey("users.id")),
            sa.Column("approved_at", sa.DateTime(timezone=True)),
            sa.Column("approval_notes", sa.Text()),
            sa.Column("notes", sa.Text()),
            sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=func.now()),
            sa.Column("sent_date", sa.DateTime(timezone=True)),
        )

    if not index_exists(bind, "offers", "ix_offers_offer_number"):
        op.create_index("ix_offers_offer_number", "offers", ["offer_number"])
    if not unique_constraint_exists(bind, "offers", "uq_offers_offer_number"):
        op.create_unique_constraint("uq_offers_offer_number", "offers", ["offer_number"])

def downgrade():
    pass

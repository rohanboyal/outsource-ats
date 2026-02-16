# backend/alembic/versions/add_offer_columns.py
"""Add bonus and work_location to offers table

Revision ID: add_offer_columns
Revises: previous_revision
Create Date: 2026-02-13

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers
revision = 'add_offer_columns'
down_revision = 'REPLACE_WITH_YOUR_LATEST_REVISION'  # Check alembic/versions/ for latest
branch_labels = None
depends_on = None


def upgrade():
    # Add missing columns
    op.add_column('offers', sa.Column('bonus', sa.Float(), nullable=True))
    op.add_column('offers', sa.Column('work_location', sa.String(255), nullable=True))
    op.add_column('offers', sa.Column('remarks', sa.Text(), nullable=True))
    op.add_column('offers', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))


def downgrade():
    op.drop_column('offers', 'version')
    op.drop_column('offers', 'remarks')
    op.drop_column('offers', 'work_location')
    op.drop_column('offers', 'bonus')

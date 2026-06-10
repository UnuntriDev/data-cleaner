"""add indexes for job listing, claiming and recovery

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-10
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Supports `ORDER BY created_at DESC` listings.
    op.create_index("ix_datasets_created_at", "datasets", ["created_at"])
    op.create_index("ix_cleaning_jobs_created_at", "cleaning_jobs", ["created_at"])
    # Supports FK joins from dataset -> jobs.
    op.create_index("ix_cleaning_jobs_dataset_id", "cleaning_jobs", ["dataset_id"])
    # Supports the stale-job recovery scan (status IN ('pending','running')).
    op.create_index("ix_cleaning_jobs_status", "cleaning_jobs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_cleaning_jobs_status", table_name="cleaning_jobs")
    op.drop_index("ix_cleaning_jobs_dataset_id", table_name="cleaning_jobs")
    op.drop_index("ix_cleaning_jobs_created_at", table_name="cleaning_jobs")
    op.drop_index("ix_datasets_created_at", table_name="datasets")

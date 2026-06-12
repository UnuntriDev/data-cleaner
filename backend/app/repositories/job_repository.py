from __future__ import annotations

from collections.abc import Sequence
from typing import Any, cast

from sqlalchemy import CursorResult, select, update
from sqlalchemy.orm import Session

from app.db.models import CleaningJob, JobStatus


class JobRepository:
    """Persistence for :class:`CleaningJob`. No business logic."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, job: CleaningJob) -> CleaningJob:
        self._session.add(job)
        self._session.flush()
        return job

    def get(self, job_id: int) -> CleaningJob | None:
        return self._session.get(CleaningJob, job_id)

    def list(self) -> list[CleaningJob]:
        stmt = select(CleaningJob).order_by(CleaningJob.created_at.desc())
        return list(self._session.scalars(stmt))

    def claim_pending(self, job_id: int) -> bool:
        """Flip pending -> running atomically. Only one caller wins."""
        result = cast(
            "CursorResult[Any]",
            self._session.execute(
                update(CleaningJob)
                .where(
                    CleaningJob.id == job_id, CleaningJob.status == JobStatus.pending
                )
                .values(status=JobStatus.running)
            ),
        )
        return result.rowcount == 1

    # Sequence (not list) because the `list` method above shadows the builtin.
    def list_unfinished(self) -> Sequence[CleaningJob]:
        """Jobs still in a non-terminal status (pending or running)."""
        stmt = select(CleaningJob).where(
            CleaningJob.status.in_([JobStatus.pending, JobStatus.running])
        )
        return list(self._session.scalars(stmt))

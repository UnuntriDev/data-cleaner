from __future__ import annotations

from sqlalchemy import select, update
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
        """Atomically move a job from pending to running.

        The conditional UPDATE means only one caller can win the claim, so two
        workers can never execute the same job.
        """
        result = self._session.execute(
            update(CleaningJob)
            .where(CleaningJob.id == job_id, CleaningJob.status == JobStatus.pending)
            .values(status=JobStatus.running)
        )
        return result.rowcount == 1

    def list_unfinished(self) -> list[CleaningJob]:
        """Jobs still in a non-terminal status (pending or running)."""
        stmt = select(CleaningJob).where(
            CleaningJob.status.in_([JobStatus.pending, JobStatus.running])
        )
        return list(self._session.scalars(stmt))

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from time import perf_counter
from typing import Any

from sqlalchemy.orm import Session

from app.cleaning.pipeline import CleaningPipeline
from app.cleaning.registry import registry
from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.core.serialization import dataframe_preview
from app.db.models import CleaningJob, JobStatus, Report
from app.io import metadata, readers, writers
from app.repositories.dataset_repository import DatasetRepository
from app.repositories.job_repository import JobRepository
from app.repositories.report_repository import ReportRepository
from app.schemas.cleaning import CleaningJobCreate, OperationInfo
from app.services.errors import NotFoundError, ValidationError

logger = get_logger(__name__)


def execute_job(job_id: int) -> None:
    # własna sesja, żeby działało zarówno z BackgroundTasks jak i z workera kolejki
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        CleaningService(session).run(job_id)
    finally:
        session.close()


class CleaningService:
    def __init__(self, session: Session, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._datasets = DatasetRepository(session)
        self._jobs = JobRepository(session)
        self._reports = ReportRepository(session)
        self._pipeline = CleaningPipeline(registry)

    def list_operations(self) -> list[OperationInfo]:
        return [OperationInfo.model_validate(spec) for spec in registry.describe()]

    def create(self, payload: CleaningJobCreate) -> CleaningJob:
        """Tworzy job w stanie pending — faktyczne czyszczenie odpala run()."""
        dataset = self._datasets.get(payload.dataset_id)
        if dataset is None:
            raise NotFoundError(f"Dataset {payload.dataset_id} not found")

        # lepiej odrzucić tu (400) niż pozwolić jobowi failować z błędem operacji
        for step in payload.operations:
            registry.get(step.operation)

        steps = [step.model_dump() for step in payload.operations]
        job = CleaningJob(
            dataset_id=dataset.id, status=JobStatus.pending, operations=steps
        )
        self._jobs.add(job)
        self._session.commit()
        logger.info(
            "Cleaning job %s created for dataset %s (%s operations)",
            job.id,
            dataset.id,
            len(steps),
        )
        return job

    def run(self, job_id: int) -> CleaningJob:
        """pending → running → completed/failed"""
        job = self.get(job_id)
        # atomowy UPDATE — przy wielu procesach tylko jeden caller to dostaje
        if not self._jobs.claim_pending(job_id):
            self._session.rollback()
            self._session.refresh(job)
            logger.warning(
                "Cleaning job %s is %s; skipping run", job.id, job.status.value
            )
            return job
        self._session.commit()
        self._session.refresh(job)

        dataset = self._datasets.get(job.dataset_id)
        if dataset is None:
            return self._fail(job, f"Dataset {job.dataset_id} not found", 0.0)

        logger.info("Cleaning job %s started (dataset %s)", job.id, dataset.id)

        start = perf_counter()
        try:
            self._execute(job, Path(dataset.file_path))
        except Exception as exc:  # noqa: BLE001 - job must record any failure
            self._session.rollback()
            logger.exception("Cleaning job %s failed", job.id)
            return self._fail(job, str(exc), perf_counter() - start)
        return job

    def _execute(self, job: CleaningJob, source_path: Path) -> None:
        start = perf_counter()
        df = readers.read_stored(source_path)
        outcome = self._pipeline.run(df, job.operations)

        result_path = self._settings.result_dir / f"job_{job.id}_{uuid.uuid4().hex}.csv"
        writers.write_file(outcome.df, result_path, "csv")
        # sidecar z podglądem — jeśli zapis się nie uda, endpoint wczyta CSV
        try:
            metadata.write_meta(
                result_path,
                {"preview": dataframe_preview(outcome.df, self._settings.preview_rows)},
            )
        except Exception:  # noqa: BLE001 - cache only
            logger.exception(
                "Failed to write preview sidecar for job %s; continuing", job.id
            )

        job.result_path = str(result_path)
        job.status = JobStatus.completed
        job.finished_at = datetime.now(UTC)

        report = outcome.report
        self._reports.add(Report(job_id=job.id, payload=report.to_dict()))
        self._session.commit()
        logger.info(
            "Cleaning job %s completed in %.2fs: rows %s -> %s, columns %s -> %s",
            job.id,
            perf_counter() - start,
            report.rows_before,
            report.rows_after,
            report.columns_before,
            report.columns_after,
        )

    def _fail(self, job: CleaningJob, error: str, duration: float) -> CleaningJob:
        job.status = JobStatus.failed
        job.error = error[:2000]
        job.finished_at = datetime.now(UTC)
        self._session.commit()
        logger.error(
            "Cleaning job %s marked failed after %.2fs: %s", job.id, duration, error
        )
        return job

    def recover_stale_jobs(self, max_age: timedelta = timedelta(0)) -> int:
        """Mark orphaned pending/running jobs as failed after a restart.

        BackgroundTasks die with the process, so anything non-terminal older
        than max_age will never finish on its own. Returns how many were
        recovered.
        """
        cutoff = datetime.now(UTC) - max_age
        recovered = 0
        for job in self._jobs.list_unfinished():
            created = job.created_at
            if created.tzinfo is None:  # SQLite stores naive UTC timestamps
                created = created.replace(tzinfo=UTC)
            if created > cutoff:
                continue
            previous = job.status.value
            job.status = JobStatus.failed
            job.error = "Przerwane przez restart serwera. Uruchom czyszczenie ponownie."
            job.finished_at = datetime.now(UTC)
            recovered += 1
            logger.warning(
                "Recovered stale cleaning job %s (was %s, created %s)",
                job.id,
                previous,
                job.created_at,
            )
        if recovered:
            self._session.commit()
            logger.info("Recovered %s stale cleaning job(s)", recovered)
        return recovered

    def get(self, job_id: int) -> CleaningJob:
        job = self._jobs.get(job_id)
        if job is None:
            raise NotFoundError(f"Cleaning job {job_id} not found")
        return job

    def list(self) -> list[CleaningJob]:
        return self._jobs.list()

    def preview_result(self, job_id: int) -> dict[str, Any]:
        job = self.get(job_id)
        if job.status != JobStatus.completed or not job.result_path:
            raise ValidationError(
                f"Cleaning job {job_id} has no result yet (status: {job.status.value})"
            )
        result_path = Path(job.result_path)
        cached = metadata.read_meta(result_path)
        if cached and "preview" in cached:
            return cached["preview"]
        df = readers.read_stored(result_path)
        return dataframe_preview(df, self._settings.preview_rows)

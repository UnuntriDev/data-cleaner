from __future__ import annotations

import uuid
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.db.models import CleaningJob, JobStatus
from app.io import readers, writers
from app.repositories.job_repository import JobRepository
from app.schemas.report import ExportRequest, ExportResult
from app.services.errors import NotFoundError, ValidationError

logger = get_logger(__name__)

_MEDIA_TYPES = {
    "csv": "text/csv",
    "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "json": "application/json",
}


@dataclass(frozen=True)
class DownloadFile:
    """A cleaned result available on disk, ready to stream with FileResponse."""

    path: Path
    filename: str
    media_type: str


class ExportService:
    """Exports a completed job's cleaned result to a file or PostgreSQL table."""

    def __init__(self, session: Session, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._jobs = JobRepository(session)

    def _completed_job(self, job_id: int) -> CleaningJob:
        """Exports are only valid for jobs that finished successfully."""
        job = self._jobs.get(job_id)
        if job is None:
            raise NotFoundError(f"Cleaning job {job_id} not found")
        if job.status != JobStatus.completed or not job.result_path:
            raise ValidationError(
                f"Cleaning job {job_id} is not completed "
                f"(status: {job.status.value}); nothing to export"
            )
        return job

    def export(self, job_id: int, request: ExportRequest) -> ExportResult:
        job = self._completed_job(job_id)
        df = readers.read_stored(Path(job.result_path))

        if request.format in writers.FILE_FORMATS:
            return self._export_file(job_id, df, request.format)
        if request.format == "postgres":
            return self._export_postgres(df, request)
        raise ValidationError(f"Unsupported export format: {request.format}")

    def resolve_download(self, job_id: int, fmt: str) -> DownloadFile:
        """Materialise a downloadable copy of a completed result on disk.

        The download is built once into the export dir (formula-escaped for
        CSV/Excel) and reused while the canonical result is unchanged. The
        canonical result CSV itself is left pristine so previews and format
        conversions keep reading the real values.
        """
        if fmt not in writers.FILE_FORMATS:
            raise ValidationError(f"Unsupported download format: {fmt}")

        job = self._completed_job(job_id)
        result_path = Path(job.result_path)
        filename = f"cleaned_job_{job_id}{writers.extension_for(fmt)}"
        path = (
            self._settings.export_dir
            / f"download_job_{job_id}{writers.extension_for(fmt)}"
        )
        stale = (
            not path.is_file() or path.stat().st_mtime < result_path.stat().st_mtime
        )
        if stale:
            df = readers.read_stored(result_path)
            writers.write_file(df, path, fmt, escape_formulas=True)
            logger.info("Prepared %s download for job %s", fmt, job_id)

        return DownloadFile(
            path=path, filename=filename, media_type=_MEDIA_TYPES[fmt]
        )

    def _export_file(self, job_id: int, df, fmt: str) -> ExportResult:
        ext = writers.extension_for(fmt)
        path = self._settings.export_dir / f"job_{job_id}_{uuid.uuid4().hex}{ext}"
        writers.write_file(df, path, fmt, escape_formulas=True)
        logger.info("Exported job %s to %s", job_id, path)
        return ExportResult(format=fmt, location=str(path), rows_exported=int(len(df)))

    def _export_postgres(self, df, request: ExportRequest) -> ExportResult:
        if not request.table_name:
            raise ValidationError("table_name is required for postgres export")
        connection_url = request.connection_url or self._settings.database_url
        writers.write_postgres(
            df, connection_url, request.table_name, request.if_exists
        )
        logger.info("Exported %s rows to table %s", len(df), request.table_name)
        return ExportResult(
            format="postgres",
            location=request.table_name,
            rows_exported=int(len(df)),
        )

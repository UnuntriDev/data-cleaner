from __future__ import annotations

import uuid
from pathlib import Path
from typing import Any, BinaryIO

import pandas as pd
from sqlalchemy.orm import Session

from app.cleaning.insights import analyze
from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.core.serialization import dataframe_preview, dataframe_stats
from app.db.models import Dataset, SourceType
from app.io import metadata, readers, uploads, writers
from app.repositories.dataset_repository import DatasetRepository
from app.services.errors import NotFoundError, ValidationError

logger = get_logger(__name__)


class DatasetService:
    """Imports datasets, persists their metadata, and serves previews."""

    def __init__(self, session: Session, settings: Settings | None = None) -> None:
        self._session = session
        self._settings = settings or get_settings()
        self._repo = DatasetRepository(session)

    def import_upload(self, filename: str, source: BinaryIO) -> Dataset:
        """Stream the upload to disk and register it.

        We parse the file once here and write the sidecar (preview, stats,
        insights) from the same DataFrame, so later requests don't re-read it.
        """
        source_type = readers.source_type_for_filename(filename)
        path = self._settings.upload_dir / f"{uuid.uuid4().hex}{Path(filename).suffix}"
        size = uploads.stream_to_disk(source, path, self._settings.max_upload_bytes)

        try:
            df = readers.read_stored(path)
        except Exception as exc:  # noqa: BLE001 - any parse error becomes a 400
            path.unlink(missing_ok=True)
            raise ValidationError(
                f"Could not parse '{filename}' as {source_type.value}: {exc}"
            ) from exc

        dataset = self._register(
            df,
            path,
            name=Path(filename).stem,
            original_filename=filename,
            source_type=source_type,
        )
        logger.info(
            "Imported file dataset %s (%s rows, %s columns, %s bytes)",
            dataset.id,
            dataset.row_count,
            dataset.column_count,
            size,
        )
        return dataset

    def import_file(self, filename: str, content: bytes) -> Dataset:
        """Wrapper for in-memory payloads (mostly tests)."""
        import io

        return self.import_upload(filename, io.BytesIO(content))

    def import_sql(self, name: str, connection_url: str, query: str) -> Dataset:
        df = readers.read_sql(connection_url, query)
        path = self._settings.upload_dir / f"{uuid.uuid4().hex}.csv"
        writers.write_file(df, path, "csv")

        dataset = self._register(
            df, path, name=name, original_filename=None, source_type=SourceType.sql
        )
        logger.info("Imported SQL dataset %s (%s rows)", dataset.id, dataset.row_count)
        return dataset

    def _register(
        self,
        df: pd.DataFrame,
        path: Path,
        *,
        name: str,
        original_filename: str | None,
        source_type: SourceType,
    ) -> Dataset:
        """Persist the dataset row and cache derived metadata in one pass."""
        self._write_sidecar(df, path)
        dataset = Dataset(
            name=name,
            original_filename=original_filename,
            source_type=source_type,
            file_path=str(path),
            row_count=int(len(df)),
            column_count=int(df.shape[1]),
        )
        self._repo.add(dataset)
        self._session.commit()
        return dataset

    def _write_sidecar(self, df: pd.DataFrame, path: Path) -> None:
        payload: dict[str, Any] = {
            "preview": dataframe_preview(df, self._settings.preview_rows),
            "stats": dataframe_stats(df),
        }
        try:
            payload["insights"] = {
                "issues": [issue.to_dict() for issue in analyze(df)]
            }
        except Exception:  # noqa: BLE001
            # not fatal, /insights will just compute it live
            logger.exception("Failed to precompute insights for %s", path.name)
        try:
            metadata.write_meta(path, payload)
        except OSError:
            logger.exception("Failed to write metadata sidecar for %s", path.name)

    def list(self) -> list[Dataset]:
        return self._repo.list()

    def get(self, dataset_id: int) -> Dataset:
        dataset = self._repo.get(dataset_id)
        if dataset is None:
            raise NotFoundError(f"Dataset {dataset_id} not found")
        return dataset

    def _cached(self, dataset: Dataset, key: str) -> Any | None:
        meta = metadata.read_meta(Path(dataset.file_path))
        return meta.get(key) if meta else None

    def preview(self, dataset_id: int) -> dict[str, Any]:
        dataset = self.get(dataset_id)
        cached = self._cached(dataset, "preview")
        if cached is not None:
            return cached
        df = readers.read_stored(Path(dataset.file_path))
        return dataframe_preview(df, self._settings.preview_rows)

    def stats(self, dataset_id: int) -> dict[str, Any]:
        dataset = self.get(dataset_id)
        cached = self._cached(dataset, "stats")
        if cached is not None:
            return cached
        df = readers.read_stored(Path(dataset.file_path))
        return dataframe_stats(df)

    def analyze(self, dataset_id: int) -> dict[str, Any]:
        """Detect data-quality issues, each with a recommended one-click fix."""
        dataset = self.get(dataset_id)
        cached = self._cached(dataset, "insights")
        if cached is not None:
            return cached
        df = readers.read_stored(Path(dataset.file_path))
        return {"issues": [issue.to_dict() for issue in analyze(df)]}

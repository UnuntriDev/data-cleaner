from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.api.deps import DatasetServiceDep
from app.core.config import get_settings
from app.schemas.dataset import (
    DataPreview,
    DatasetOut,
    DatasetStats,
    InsightsResponse,
    SqlImportRequest,
)

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/upload", response_model=DatasetOut, status_code=201)
async def upload_dataset(
    service: DatasetServiceDep, file: UploadFile = File(...)
) -> DatasetOut:
    # Hand the spooled file object to the service, which streams it to disk
    # chunk by chunk — the upload is never held in memory as one blob.
    dataset = await run_in_threadpool(
        service.import_upload,
        file.filename or "upload",
        file.file,
    )
    return DatasetOut.model_validate(dataset)


@router.post("/import-sql", response_model=DatasetOut, status_code=201)
def import_sql(payload: SqlImportRequest, service: DatasetServiceDep) -> DatasetOut:
    # SECURITY: this endpoint connects out to a caller-supplied database URL and
    # runs a caller-supplied query. In a hosted deployment that is an SSRF /
    # internal-network access vector, so it is disabled unless an operator
    # explicitly opts in via ENABLE_SQL_IMPORT=true.
    if not get_settings().enable_sql_import:
        raise HTTPException(status_code=403, detail="SQL import is disabled")
    dataset = service.import_sql(payload.name, payload.connection_url, payload.query)
    return DatasetOut.model_validate(dataset)


@router.get("", response_model=list[DatasetOut])
def list_datasets(service: DatasetServiceDep) -> list[DatasetOut]:
    return [DatasetOut.model_validate(d) for d in service.list()]


@router.get("/{dataset_id}/preview", response_model=DataPreview)
def preview_dataset(dataset_id: int, service: DatasetServiceDep) -> DataPreview:
    return DataPreview(**service.preview(dataset_id))


@router.get("/{dataset_id}/stats", response_model=DatasetStats)
def dataset_stats(dataset_id: int, service: DatasetServiceDep) -> DatasetStats:
    return DatasetStats(**service.stats(dataset_id))


@router.get("/{dataset_id}/insights", response_model=InsightsResponse)
def dataset_insights(dataset_id: int, service: DatasetServiceDep) -> InsightsResponse:
    return InsightsResponse(**service.analyze(dataset_id))

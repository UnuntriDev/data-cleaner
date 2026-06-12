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
    # streams to disk in chunks, never buffered fully in memory
    dataset = await run_in_threadpool(
        service.import_upload,
        file.filename or "upload",
        file.file,
    )
    return DatasetOut.model_validate(dataset)


@router.post("/import-sql", response_model=DatasetOut, status_code=201)
def import_sql(payload: SqlImportRequest, service: DatasetServiceDep) -> DatasetOut:
    # SSRF risk: caller-supplied URL + query. Disabled unless
    # ENABLE_SQL_IMPORT=true is set by the operator.
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

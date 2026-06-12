from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.api.deps import ExportServiceDep
from app.schemas.report import ExportRequest, ExportResult

router = APIRouter(prefix="/exports", tags=["exports"])


@router.post("/{job_id}", response_model=ExportResult)
def export_job(
    job_id: int, payload: ExportRequest, service: ExportServiceDep
) -> ExportResult:
    return service.export(job_id, payload)


@router.get("/{job_id}/download")
def download_job(
    job_id: int, service: ExportServiceDep, format: str = "csv"
) -> FileResponse:
    # streams from disk, no in-memory buffering
    download = service.resolve_download(job_id, format)
    return FileResponse(
        download.path,
        media_type=download.media_type,
        filename=download.filename,
    )

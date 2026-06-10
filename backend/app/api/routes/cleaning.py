from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks

from app.api.deps import CleaningServiceDep
from app.schemas.cleaning import CleaningJobCreate, CleaningJobOut, OperationInfo
from app.schemas.dataset import DataPreview
from app.services.cleaning_service import execute_job

router = APIRouter(prefix="/cleaning", tags=["cleaning"])


@router.get("/operations", response_model=list[OperationInfo])
def list_operations(service: CleaningServiceDep) -> list[OperationInfo]:
    return service.list_operations()


@router.post("/jobs", response_model=CleaningJobOut, status_code=202)
def create_job(
    payload: CleaningJobCreate,
    service: CleaningServiceDep,
    background_tasks: BackgroundTasks,
) -> CleaningJobOut:
    """Create the job quickly; the cleaning itself runs after the response."""
    job = service.create(payload)
    background_tasks.add_task(execute_job, job.id)
    return CleaningJobOut.model_validate(job)


@router.get("/jobs", response_model=list[CleaningJobOut])
def list_jobs(service: CleaningServiceDep) -> list[CleaningJobOut]:
    return [CleaningJobOut.model_validate(j) for j in service.list()]


@router.get("/jobs/{job_id}", response_model=CleaningJobOut)
def get_job(job_id: int, service: CleaningServiceDep) -> CleaningJobOut:
    return CleaningJobOut.model_validate(service.get(job_id))


@router.get("/jobs/{job_id}/preview", response_model=DataPreview)
def preview_job(job_id: int, service: CleaningServiceDep) -> DataPreview:
    return DataPreview(**service.preview_result(job_id))

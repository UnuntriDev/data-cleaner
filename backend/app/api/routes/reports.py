from __future__ import annotations

from fastapi import APIRouter

from app.api.deps import ReportServiceDep
from app.schemas.report import ReportOut

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/by-job/{job_id}", response_model=ReportOut)
def get_report_by_job(job_id: int, service: ReportServiceDep) -> ReportOut:
    return ReportOut.model_validate(service.get_by_job(job_id))


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int, service: ReportServiceDep) -> ReportOut:
    return ReportOut.model_validate(service.get(report_id))

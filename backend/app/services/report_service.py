from __future__ import annotations

from sqlalchemy.orm import Session

from app.db.models import Report
from app.repositories.report_repository import ReportRepository
from app.services.errors import NotFoundError


class ReportService:
    """Read access to cleaning reports."""

    def __init__(self, session: Session) -> None:
        self._reports = ReportRepository(session)

    def get(self, report_id: int) -> Report:
        report = self._reports.get(report_id)
        if report is None:
            raise NotFoundError(f"Report {report_id} not found")
        return report

    def get_by_job(self, job_id: int) -> Report:
        report = self._reports.get_by_job(job_id)
        if report is None:
            raise NotFoundError(f"Report for job {job_id} not found")
        return report

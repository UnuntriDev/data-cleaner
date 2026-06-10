from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Report


class ReportRepository:
    """Persistence for :class:`Report`. No business logic."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, report: Report) -> Report:
        self._session.add(report)
        self._session.flush()
        return report

    def get(self, report_id: int) -> Report | None:
        return self._session.get(Report, report_id)

    def get_by_job(self, job_id: int) -> Report | None:
        stmt = select(Report).where(Report.job_id == job_id)
        return self._session.scalars(stmt).first()

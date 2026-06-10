from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.services.cleaning_service import CleaningService
from app.services.dataset_service import DatasetService
from app.services.export_service import ExportService
from app.services.report_service import ReportService

SessionDep = Annotated[Session, Depends(get_session)]


def get_dataset_service(session: SessionDep) -> DatasetService:
    return DatasetService(session)


def get_cleaning_service(session: SessionDep) -> CleaningService:
    return CleaningService(session)


def get_report_service(session: SessionDep) -> ReportService:
    return ReportService(session)


def get_export_service(session: SessionDep) -> ExportService:
    return ExportService(session)


DatasetServiceDep = Annotated[DatasetService, Depends(get_dataset_service)]
CleaningServiceDep = Annotated[CleaningService, Depends(get_cleaning_service)]
ReportServiceDep = Annotated[ReportService, Depends(get_report_service)]
ExportServiceDep = Annotated[ExportService, Depends(get_export_service)]

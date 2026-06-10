from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_id: int
    payload: dict[str, Any]
    created_at: datetime


class ExportRequest(BaseModel):
    format: str  # csv | excel | json | postgres
    # Only used for the postgres target:
    table_name: str | None = None
    connection_url: str | None = None
    if_exists: str = "replace"  # replace | append | fail


class ExportResult(BaseModel):
    format: str
    location: str
    rows_exported: int

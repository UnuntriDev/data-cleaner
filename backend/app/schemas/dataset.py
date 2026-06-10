from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.db.models import SourceType


class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    original_filename: str | None
    source_type: SourceType
    row_count: int
    column_count: int
    created_at: datetime


class DataPreview(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    total_rows: int
    returned_rows: int


class DatasetStats(BaseModel):
    rows: int
    columns: int
    missing_cells: int
    missing_pct: float
    columns_with_missing: int
    duplicate_rows: int


class OperationStep(BaseModel):
    operation: str
    params: dict[str, Any]


class InsightOut(BaseModel):
    code: str
    title: str
    detail: str
    severity: str
    count: int
    recommended: bool
    column: str | None = None
    steps: list[OperationStep]


class InsightsResponse(BaseModel):
    issues: list[InsightOut]


class SqlImportRequest(BaseModel):
    name: str
    connection_url: str
    query: str

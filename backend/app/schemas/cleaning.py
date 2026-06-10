from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import JobStatus


class OperationStep(BaseModel):
    """A single user-selected operation and its parameters."""

    operation: str = Field(..., description="Operation registry name")
    params: dict[str, Any] = Field(default_factory=dict)


class CleaningJobCreate(BaseModel):
    dataset_id: int
    operations: list[OperationStep] = Field(default_factory=list)


class CleaningJobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dataset_id: int
    status: JobStatus
    operations: list[dict[str, Any]]
    result_path: str | None
    error: str | None
    created_at: datetime
    finished_at: datetime | None


class OperationParam(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    type: str
    required: bool
    description: str | None = None


class OperationInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    label: str
    description: str
    params: list[OperationParam]

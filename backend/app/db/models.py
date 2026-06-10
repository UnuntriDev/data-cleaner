from __future__ import annotations

import enum
from datetime import datetime
from typing import Any

from sqlalchemy import Enum, ForeignKey, Index, Integer, String
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class SourceType(str, enum.Enum):
    csv = "csv"
    excel = "excel"
    json = "json"
    sql = "sql"


class JobStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class Dataset(Base, TimestampMixin):
    __tablename__ = "datasets"
    __table_args__ = (Index("ix_datasets_created_at", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str | None] = mapped_column(String(255))
    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    column_count: Mapped[int] = mapped_column(Integer, default=0)

    jobs: Mapped[list[CleaningJob]] = relationship(
        back_populates="dataset", cascade="all, delete-orphan"
    )


class CleaningJob(Base, TimestampMixin):
    __tablename__ = "cleaning_jobs"
    __table_args__ = (Index("ix_cleaning_jobs_created_at", "created_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    dataset_id: Mapped[int] = mapped_column(
        ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus), default=JobStatus.pending, nullable=False, index=True
    )
    operations: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    result_path: Mapped[str | None] = mapped_column(String(1024))
    error: Mapped[str | None] = mapped_column(String(2048))
    finished_at: Mapped[datetime | None]

    dataset: Mapped[Dataset] = relationship(back_populates="jobs")
    report: Mapped[Report | None] = relationship(
        back_populates="job", cascade="all, delete-orphan", uselist=False
    )


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("cleaning_jobs.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)

    job: Mapped[CleaningJob] = relationship(back_populates="report")

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Dataset


class DatasetRepository:
    """Persistence for :class:`Dataset`. No business logic."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def add(self, dataset: Dataset) -> Dataset:
        self._session.add(dataset)
        self._session.flush()
        return dataset

    def get(self, dataset_id: int) -> Dataset | None:
        return self._session.get(Dataset, dataset_id)

    def list(self) -> list[Dataset]:
        stmt = select(Dataset).order_by(Dataset.created_at.desc())
        return list(self._session.scalars(stmt))

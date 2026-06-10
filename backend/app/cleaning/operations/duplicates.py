from __future__ import annotations

from typing import ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult


class RemoveDuplicatesParams(BaseModel):
    subset: list[str] | None = Field(
        default=None, description="Columns to consider; null means all columns"
    )
    keep: str = Field(default="first", description="first | last | none")


class RemoveDuplicatesOperation(CleaningOperation):
    name: ClassVar[str] = "remove_duplicates"
    label: ClassVar[str] = "Remove duplicates"
    description: ClassVar[str] = "Detect and drop duplicate rows."
    ParamsModel: ClassVar[type[BaseModel]] = RemoveDuplicatesParams

    def execute(self, df: pd.DataFrame, params: RemoveDuplicatesParams) -> OperationResult:
        subset = params.subset or None
        keep: str | bool = False if params.keep == "none" else params.keep
        duplicate_mask = df.duplicated(subset=subset, keep=keep)
        removed = int(duplicate_mask.sum())
        cleaned = df.loc[~duplicate_mask].reset_index(drop=True)
        return OperationResult(
            df=cleaned,
            metadata={"removed_duplicates": removed, "subset": subset},
        )

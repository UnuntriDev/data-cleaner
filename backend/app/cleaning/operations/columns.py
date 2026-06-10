from __future__ import annotations

from typing import ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult


class RenameColumnsParams(BaseModel):
    mapping: dict[str, str] = Field(..., description="Map of old name -> new name")


class RenameColumnsOperation(CleaningOperation):
    name: ClassVar[str] = "rename_columns"
    label: ClassVar[str] = "Rename columns"
    description: ClassVar[str] = "Rename columns using an explicit mapping."
    ParamsModel: ClassVar[type[BaseModel]] = RenameColumnsParams

    def execute(self, df: pd.DataFrame, params: RenameColumnsParams) -> OperationResult:
        mapping = {k: v for k, v in params.mapping.items() if k in df.columns}
        result = df.rename(columns=mapping)
        return OperationResult(df=result, metadata={"renamed": mapping})


class RemoveColumnsParams(BaseModel):
    columns: list[str] = Field(..., description="Columns to drop")


class RemoveColumnsOperation(CleaningOperation):
    name: ClassVar[str] = "remove_columns"
    label: ClassVar[str] = "Remove columns"
    description: ClassVar[str] = "Drop the selected columns."
    ParamsModel: ClassVar[type[BaseModel]] = RemoveColumnsParams

    def execute(self, df: pd.DataFrame, params: RemoveColumnsParams) -> OperationResult:
        to_drop = [c for c in params.columns if c in df.columns]
        result = df.drop(columns=to_drop)
        return OperationResult(df=result, metadata={"removed_columns": to_drop})

from __future__ import annotations

import re
from typing import ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult

_NON_ALNUM = re.compile(r"[^0-9a-zA-Z]+")
_CAMEL_BOUNDARY = re.compile(r"(?<=[a-z0-9])(?=[A-Z])")


class CleanColumnNamesParams(BaseModel):
    lowercase: bool = Field(default=True)
    snake_case: bool = Field(default=True)
    remove_special: bool = Field(
        default=True, description="Replace spaces and special characters"
    )


class CleanColumnNamesOperation(CleaningOperation):
    name: ClassVar[str] = "clean_column_names"
    label: ClassVar[str] = "Clean column names"
    description: ClassVar[str] = (
        "Normalize column names: lowercase, snake_case, strip special characters."
    )
    ParamsModel: ClassVar[type[BaseModel]] = CleanColumnNamesParams

    def execute(
        self, df: pd.DataFrame, params: CleanColumnNamesParams
    ) -> OperationResult:
        mapping = {col: self._normalize(str(col), params) for col in df.columns}
        result = df.rename(columns=mapping)
        renamed = {k: v for k, v in mapping.items() if k != v}
        return OperationResult(df=result, metadata={"renamed": renamed})

    @staticmethod
    def _normalize(name: str, params: CleanColumnNamesParams) -> str:
        out = name.strip()
        if params.snake_case:
            out = _CAMEL_BOUNDARY.sub("_", out)
        if params.remove_special or params.snake_case:
            out = _NON_ALNUM.sub("_", out)
            out = out.strip("_")
        if params.lowercase:
            out = out.lower()
        return out or name

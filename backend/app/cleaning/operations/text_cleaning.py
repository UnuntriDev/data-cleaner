from __future__ import annotations

import re
from typing import ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult

_VALID_TRANSFORMS = {
    "trim",
    "lowercase",
    "uppercase",
    "title",
    "remove_empty",
    "remove_special",
}
_SPECIAL_CHARS = re.compile(r"[^A-Za-z0-9\s]")


class CleanTextParams(BaseModel):
    columns: list[str] | None = Field(
        default=None, description="Text columns; null means all object/string columns"
    )
    transforms: list[str] = Field(
        default_factory=list, description=" | ".join(sorted(_VALID_TRANSFORMS))
    )


class CleanTextOperation(CleaningOperation):
    name: ClassVar[str] = "clean_text"
    label: ClassVar[str] = "Clean text"
    description: ClassVar[str] = (
        "Trim, change case, remove empty strings or special characters in text columns."
    )
    ParamsModel: ClassVar[type[BaseModel]] = CleanTextParams

    def execute(self, df: pd.DataFrame, params: CleanTextParams) -> OperationResult:
        unknown = set(params.transforms) - _VALID_TRANSFORMS
        if unknown:
            raise ValueError(f"Unknown text transforms: {sorted(unknown)}")

        result = df.copy()
        targets = params.columns or [
            c
            for c in result.columns
            if pd.api.types.is_object_dtype(result[c])
            or pd.api.types.is_string_dtype(result[c])
        ]

        for col in targets:
            if col in result.columns:
                result[col] = self._apply(result[col], params.transforms)

        return OperationResult(
            df=result,
            metadata={"columns": targets, "transforms": params.transforms},
        )

    @staticmethod
    def _apply(series: pd.Series, transforms: list[str]) -> pd.Series:
        out = series
        for transform in transforms:
            if transform == "trim":
                out = out.str.strip()
            elif transform == "lowercase":
                out = out.str.lower()
            elif transform == "uppercase":
                out = out.str.upper()
            elif transform == "title":
                out = out.str.title()
            elif transform == "remove_special":
                out = out.map(
                    lambda v: _SPECIAL_CHARS.sub("", v) if isinstance(v, str) else v
                )
            elif transform == "remove_empty":
                out = out.map(
                    lambda v: pd.NA if isinstance(v, str) and v.strip() == "" else v
                )
        return out

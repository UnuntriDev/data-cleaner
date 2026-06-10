from __future__ import annotations

from typing import ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult


class ParseDatesParams(BaseModel):
    columns: list[str] = Field(..., description="Columns to parse as dates")
    output_format: str | None = Field(
        default=None,
        description="strftime format for the normalized output; null keeps datetime",
    )
    dayfirst: bool = Field(default=False)


class ParseDatesOperation(CleaningOperation):
    name: ClassVar[str] = "parse_dates"
    label: ClassVar[str] = "Parse / normalize dates"
    description: ClassVar[str] = (
        "Parse date columns and optionally normalize them to a single format."
    )
    ParamsModel: ClassVar[type[BaseModel]] = ParseDatesParams

    def execute(self, df: pd.DataFrame, params: ParseDatesParams) -> OperationResult:
        result = df.copy()
        parsed: dict[str, int] = {}

        for col in params.columns:
            if col not in result.columns:
                continue
            coerced = pd.to_datetime(
                result[col],
                errors="coerce",
                dayfirst=params.dayfirst,
                format="mixed",
            )
            failures = int(coerced.isna().sum() - result[col].isna().sum())
            parsed[col] = max(failures, 0)
            result[col] = (
                coerced.dt.strftime(params.output_format)
                if params.output_format
                else coerced
            )

        return OperationResult(
            df=result,
            metadata={
                "columns": params.columns,
                "output_format": params.output_format,
                "parse_failures": parsed,
            },
        )

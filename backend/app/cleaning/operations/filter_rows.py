from __future__ import annotations

from typing import Any, ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult

_OPERATORS = {"eq", "ne", "gt", "ge", "lt", "le", "contains", "in", "notnull", "isnull"}


class FilterRowsParams(BaseModel):
    column: str
    operator: str = Field(..., description=" | ".join(sorted(_OPERATORS)))
    value: Any | None = None
    keep_matching: bool = Field(
        default=True, description="Keep rows that match (true) or drop them (false)"
    )


class FilterRowsOperation(CleaningOperation):
    name: ClassVar[str] = "filter_rows"
    label: ClassVar[str] = "Filter rows"
    description: ClassVar[str] = "Keep or drop rows based on a column condition."
    ParamsModel: ClassVar[type[BaseModel]] = FilterRowsParams

    def execute(self, df: pd.DataFrame, params: FilterRowsParams) -> OperationResult:
        if params.operator not in _OPERATORS:
            raise ValueError(f"Unknown filter operator: {params.operator}")
        if params.column not in df.columns:
            raise ValueError(f"Unknown column: {params.column}")

        mask = self._mask(df[params.column], params)
        keep_mask = mask if params.keep_matching else ~mask
        result = df.loc[keep_mask].reset_index(drop=True)

        return OperationResult(
            df=result,
            metadata={
                "column": params.column,
                "operator": params.operator,
                "rows_before": int(len(df)),
                "rows_after": int(len(result)),
                "rows_removed": int(len(df) - len(result)),
            },
        )

    @staticmethod
    def _mask(series: pd.Series, params: FilterRowsParams) -> pd.Series:
        op, value = params.operator, params.value
        if op == "eq":
            return series == value
        if op == "ne":
            return series != value
        if op == "gt":
            return series > value
        if op == "ge":
            return series >= value
        if op == "lt":
            return series < value
        if op == "le":
            return series <= value
        if op == "contains":
            return series.astype("string").str.contains(str(value), na=False)
        if op == "in":
            values = value if isinstance(value, list) else [value]
            return series.isin(values)
        if op == "notnull":
            return series.notna()
        if op == "isnull":
            return series.isna()
        raise ValueError(f"Unknown filter operator: {op}")

from __future__ import annotations

from typing import Any, ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult

_STRATEGIES = {
    "drop_rows",
    "drop_columns",
    "mean",
    "median",
    "mode",
    "custom",
    "ffill",
    "bfill",
}


class HandleMissingParams(BaseModel):
    strategy: str = Field(..., description=" | ".join(sorted(_STRATEGIES)))
    columns: list[str] | None = Field(
        default=None, description="Target columns; null means all columns"
    )
    custom_value: Any | None = Field(
        default=None, description="Fill value when strategy is 'custom'"
    )


class HandleMissingOperation(CleaningOperation):
    name: ClassVar[str] = "handle_missing"
    label: ClassVar[str] = "Handle missing values"
    description: ClassVar[str] = (
        "Drop rows/columns or impute missing values (mean, median, mode, "
        "custom, forward fill, backward fill)."
    )
    ParamsModel: ClassVar[type[BaseModel]] = HandleMissingParams

    def execute(self, df: pd.DataFrame, params: HandleMissingParams) -> OperationResult:
        if params.strategy not in _STRATEGIES:
            raise ValueError(f"Unknown missing-value strategy: {params.strategy}")

        targets = params.columns or list(df.columns)
        missing_before = int(df[targets].isna().sum().sum())
        result = df.copy()

        if params.strategy == "drop_rows":
            result = result.dropna(subset=targets).reset_index(drop=True)
        elif params.strategy == "drop_columns":
            cols_with_na = [c for c in targets if result[c].isna().any()]
            result = result.drop(columns=cols_with_na)
        else:
            for col in targets:
                result[col] = self._fill_column(result[col], params)

        remaining = [c for c in targets if c in result.columns]
        missing_after = int(result[remaining].isna().sum().sum()) if remaining else 0
        return OperationResult(
            df=result,
            metadata={
                "strategy": params.strategy,
                "columns": targets,
                "missing_before": missing_before,
                "missing_after": missing_after,
                "handled": max(missing_before - missing_after, 0),
            },
        )

    @staticmethod
    def _fill_column(series: pd.Series, params: HandleMissingParams) -> pd.Series:
        strategy = params.strategy
        if strategy == "mean":
            return series.fillna(series.mean()) if _is_numeric(series) else series
        if strategy == "median":
            return series.fillna(series.median()) if _is_numeric(series) else series
        if strategy == "mode":
            mode = series.mode(dropna=True)
            return series.fillna(mode.iloc[0]) if not mode.empty else series
        if strategy == "custom":
            return series.fillna(params.custom_value)
        if strategy == "ffill":
            return series.ffill()
        if strategy == "bfill":
            return series.bfill()
        return series


def _is_numeric(series: pd.Series) -> bool:
    return pd.api.types.is_numeric_dtype(series)

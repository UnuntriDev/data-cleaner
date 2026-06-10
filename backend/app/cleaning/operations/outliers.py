from __future__ import annotations

from typing import ClassVar

import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult


class DetectOutliersParams(BaseModel):
    method: str = Field(default="iqr", description="iqr | zscore")
    columns: list[str] | None = Field(
        default=None, description="Numeric columns; null means all numeric columns"
    )
    threshold: float = Field(
        default=1.5, description="IQR multiplier (1.5) or Z-score cutoff (e.g. 3.0)"
    )
    action: str = Field(default="flag", description="flag | remove")


class DetectOutliersOperation(CleaningOperation):
    name: ClassVar[str] = "detect_outliers"
    label: ClassVar[str] = "Detect outliers"
    description: ClassVar[str] = "Detect outliers via IQR or Z-score; flag or remove them."
    ParamsModel: ClassVar[type[BaseModel]] = DetectOutliersParams

    def execute(self, df: pd.DataFrame, params: DetectOutliersParams) -> OperationResult:
        if params.method not in {"iqr", "zscore"}:
            raise ValueError(f"Unknown outlier method: {params.method}")

        numeric_cols = params.columns or list(
            df.select_dtypes(include=np.number).columns
        )
        per_column: dict[str, int] = {}
        outlier_mask = pd.Series(False, index=df.index)

        for col in numeric_cols:
            if col not in df.columns or not pd.api.types.is_numeric_dtype(df[col]):
                continue
            mask = self._mask(df[col], params)
            per_column[col] = int(mask.sum())
            outlier_mask |= mask

        total = int(outlier_mask.sum())
        result = df
        if params.action == "remove":
            result = df.loc[~outlier_mask].reset_index(drop=True)

        return OperationResult(
            df=result,
            metadata={
                "method": params.method,
                "threshold": params.threshold,
                "action": params.action,
                "outliers_per_column": per_column,
                "total_outliers": total,
            },
        )

    @staticmethod
    def _mask(series: pd.Series, params: DetectOutliersParams) -> pd.Series:
        values = series.astype("float64")
        if params.method == "iqr":
            q1, q3 = values.quantile(0.25), values.quantile(0.75)
            iqr = q3 - q1
            lower, upper = q1 - params.threshold * iqr, q3 + params.threshold * iqr
            return (values < lower) | (values > upper)
        std = values.std(ddof=0)
        if std == 0 or np.isnan(std):
            return pd.Series(False, index=series.index)
        z = (values - values.mean()) / std
        return z.abs() > params.threshold

from __future__ import annotations

from typing import ClassVar

import pandas as pd
from pydantic import BaseModel, Field

from app.cleaning.base import CleaningOperation, OperationResult

_SUPPORTED_TYPES = {"string", "int", "float", "bool", "datetime", "category"}

_TRUE_TOKENS = {"true", "1", "yes", "y", "t"}
_FALSE_TOKENS = {"false", "0", "no", "n", "f"}


class ConvertTypesParams(BaseModel):
    conversions: dict[str, str] = Field(
        ..., description="Map of column -> target type " + str(sorted(_SUPPORTED_TYPES))
    )


class ConvertTypesOperation(CleaningOperation):
    name: ClassVar[str] = "convert_types"
    label: ClassVar[str] = "Convert data types"
    description: ClassVar[str] = (
        "Convert columns to string, int, float, bool, datetime, or category."
    )
    ParamsModel: ClassVar[type[BaseModel]] = ConvertTypesParams

    def execute(self, df: pd.DataFrame, params: ConvertTypesParams) -> OperationResult:
        result = df.copy()
        converted: dict[str, str] = {}
        errors: dict[str, int] = {}

        for column, target in params.conversions.items():
            if column not in result.columns:
                continue
            if target not in _SUPPORTED_TYPES:
                raise ValueError(f"Unsupported target type: {target}")
            series, error_count = self._convert(result[column], target)
            result[column] = series
            converted[column] = target
            if error_count:
                errors[column] = error_count

        return OperationResult(
            df=result,
            metadata={"converted": converted, "conversion_errors": errors},
        )

    @staticmethod
    def _convert(series: pd.Series, target: str) -> tuple[pd.Series, int]:
        """Return the converted series and the count of values that failed."""
        if target == "string":
            return series.astype("string"), 0
        if target == "category":
            return series.astype("category"), 0
        if target == "int":
            coerced = pd.to_numeric(series, errors="coerce")
            errors = int(coerced.isna().sum() - series.isna().sum())
            return coerced.astype("Int64"), max(errors, 0)
        if target == "float":
            coerced = pd.to_numeric(series, errors="coerce")
            errors = int(coerced.isna().sum() - series.isna().sum())
            return coerced.astype("float64"), max(errors, 0)
        if target == "datetime":
            coerced = pd.to_datetime(series, errors="coerce")
            errors = int(coerced.isna().sum() - series.isna().sum())
            return coerced, max(errors, 0)
        if target == "bool":
            return ConvertTypesOperation._to_bool(series)
        raise ValueError(f"Unsupported target type: {target}")

    @staticmethod
    def _to_bool(series: pd.Series) -> tuple[pd.Series, int]:
        def parse(value: object) -> object:
            if pd.isna(value):
                return pd.NA
            token = str(value).strip().lower()
            if token in _TRUE_TOKENS:
                return True
            if token in _FALSE_TOKENS:
                return False
            return pd.NA

        converted = series.map(parse)
        errors = int(converted.isna().sum() - series.isna().sum())
        return converted.astype("boolean"), max(errors, 0)

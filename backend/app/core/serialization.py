from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


def dataframe_preview(df: pd.DataFrame, limit: int) -> dict[str, Any]:
    head = df.head(limit)
    return {
        "columns": [str(c) for c in df.columns],
        "rows": _records(head),
        "total_rows": int(len(df)),
        "returned_rows": int(len(head)),
    }


def dataframe_stats(df: pd.DataFrame) -> dict[str, Any]:
    total_cells = int(df.size)
    missing_cells = int(df.isna().sum().sum())
    duplicate_rows = int(df.duplicated().sum())
    columns_with_missing = int((df.isna().sum() > 0).sum())
    return {
        "rows": int(len(df)),
        "columns": int(df.shape[1]),
        "missing_cells": missing_cells,
        "missing_pct": round(missing_cells / total_cells * 100, 2) if total_cells else 0.0,
        "columns_with_missing": columns_with_missing,
        "duplicate_rows": duplicate_rows,
    }


def _records(df: pd.DataFrame) -> list[dict[str, Any]]:
    # coerce NaN/NaT to None before converting to dicts
    cleaned = df.replace({np.nan: None}).where(pd.notna(df), None)
    records: list[dict[str, Any]] = []
    for row in cleaned.to_dict(orient="records"):
        records.append({str(k): _scalar(v) for k, v in row.items()})
    return records


def _scalar(value: Any) -> Any:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    return value

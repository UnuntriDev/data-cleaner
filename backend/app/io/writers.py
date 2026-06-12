from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine

# File formats this writer can produce on disk.
FILE_FORMATS = {"csv", "excel", "json"}
_EXTENSIONS = {"csv": ".csv", "excel": ".xlsx", "json": ".json"}

# chars a spreadsheet treats as the start of a formula (csv/excel injection)
_FORMULA_PREFIXES = ("=", "+", "-", "@", "\t", "\r")


def extension_for(fmt: str) -> str:
    try:
        return _EXTENSIONS[fmt]
    except KeyError as exc:
        raise ValueError(f"Unsupported file format: {fmt}") from exc


def _escape_cell(value: object) -> object:
    if isinstance(value, str) and value.startswith(_FORMULA_PREFIXES):
        return "'" + value
    return value


def escape_formula_injection(df: pd.DataFrame) -> pd.DataFrame:
    """Prefix formula-looking text cells with ' so spreadsheets don't run them.

    Only touches string cells, numeric -3 stays numeric.
    """
    text_cols = df.select_dtypes(include=["object", "string"]).columns
    if not len(text_cols):
        return df
    df = df.copy()
    for col in text_cols:
        df[col] = df[col].map(_escape_cell)
    return df


def write_file(
    df: pd.DataFrame, path: Path, fmt: str, escape_formulas: bool = False
) -> None:
    """Write a DataFrame to disk in the requested format.

    Set escape_formulas for files a user will open in a spreadsheet. Internal
    artifacts (the stored result csv) are written without it so the data
    stays as-is.
    """
    if escape_formulas and fmt in {"csv", "excel"}:
        df = escape_formula_injection(df)
    if fmt == "csv":
        df.to_csv(path, index=False)
    elif fmt == "excel":
        df.to_excel(path, index=False)
    elif fmt == "json":
        df.to_json(path, orient="records", date_format="iso")
    else:
        raise ValueError(f"Unsupported file format: {fmt}")


def write_postgres(
    df: pd.DataFrame,
    connection_url: str,
    table_name: str,
    if_exists: str = "replace",
) -> None:
    """Write a DataFrame to a PostgreSQL table."""
    engine = create_engine(connection_url, pool_pre_ping=True, future=True)
    try:
        df.to_sql(table_name, engine, if_exists=if_exists, index=False)
    finally:
        engine.dispose()

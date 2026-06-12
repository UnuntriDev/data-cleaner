from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text

from app.db.models import SourceType

_EXTENSION_TO_SOURCE = {
    ".csv": SourceType.csv,
    ".xlsx": SourceType.excel,
    ".xls": SourceType.excel,
    ".json": SourceType.json,
}


def source_type_for_filename(filename: str) -> SourceType:
    suffix = Path(filename).suffix.lower()
    if suffix not in _EXTENSION_TO_SOURCE:
        raise ValueError(f"Unsupported file type: {suffix or '(none)'}")
    return _EXTENSION_TO_SOURCE[suffix]


def read_stored(path: Path) -> pd.DataFrame:
    """Read a dataset file, picking the parser from its extension."""
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path)
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    if suffix == ".json":
        return pd.read_json(path)
    raise ValueError(f"Cannot read stored file: {path.name}")


def read_sql(connection_url: str, query: str) -> pd.DataFrame:
    """Run a SQL query and return the result as a DataFrame."""
    engine = create_engine(connection_url, pool_pre_ping=True, future=True)
    try:
        with engine.connect() as conn:
            return pd.read_sql(text(query), conn)
    finally:
        engine.dispose()

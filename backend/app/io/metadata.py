from __future__ import annotations

import json
from pathlib import Path
from typing import Any

# sidecars sit next to the data file, so they get copied/deleted together
# and we don't need a schema change
_SUFFIX = ".meta.json"


def meta_path(data_path: Path) -> Path:
    return data_path.with_name(data_path.name + _SUFFIX)


def write_meta(data_path: Path, payload: dict[str, Any]) -> None:
    """Write the sidecar json next to a dataset file."""
    meta_path(data_path).write_text(
        json.dumps(payload, ensure_ascii=False, default=str), encoding="utf-8"
    )


def read_meta(data_path: Path) -> dict[str, Any] | None:
    """Read the sidecar, None on cache miss or unreadable file."""
    path = meta_path(data_path)
    if not path.is_file():
        return None
    try:
        loaded = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return loaded if isinstance(loaded, dict) else None

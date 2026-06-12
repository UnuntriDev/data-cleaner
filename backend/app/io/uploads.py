from __future__ import annotations

from pathlib import Path
from typing import BinaryIO

_CHUNK_SIZE = 1024 * 1024  # 1 MiB


def stream_to_disk(source: BinaryIO, dest: Path, max_bytes: int) -> int:
    """Copy an upload to disk chunk by chunk, enforcing the size limit.

    Raises ValueError (-> 400 upstream) and removes the partial file if the
    limit is exceeded. Returns bytes written.
    """
    written = 0
    try:
        with dest.open("wb") as out:
            while chunk := source.read(_CHUNK_SIZE):
                written += len(chunk)
                if written > max_bytes:
                    raise ValueError(
                        f"File exceeds the upload limit of "
                        f"{max_bytes // (1024 * 1024)} MB"
                    )
                out.write(chunk)
    except Exception:
        dest.unlink(missing_ok=True)
        raise
    return written

import os
import tempfile
from pathlib import Path

import pandas as pd
import pytest

# Point the app at throwaway storage/DB BEFORE any app module is imported
# (test modules are collected after conftest), so API tests never touch the
# real app.db or _storage.
_TMP = Path(tempfile.mkdtemp(prefix="data-cleaner-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_TMP / 'test.db').as_posix()}"
os.environ["STORAGE_DIR"] = str(_TMP / "storage")


@pytest.fixture
def messy_df() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "Name ": ["  Alice ", "bob", "bob", "CAROL", None],
            "Age": [30, 25, 25, None, 40],
            "City": ["NYC", "LA", "LA", "  ", "SF"],
            "Joined": ["2021-01-01", "2021/02/15", "2021/02/15", "not-a-date", None],
        }
    )

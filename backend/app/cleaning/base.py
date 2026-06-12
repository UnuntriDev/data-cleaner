from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, ClassVar

import pandas as pd
from pydantic import BaseModel


@dataclass
class OperationResult:
    """Transformed DataFrame + metadata for the report."""

    df: pd.DataFrame
    metadata: dict[str, Any] = field(default_factory=dict)


class CleaningOperation(ABC):
    """Base class for cleaning operations."""

    name: ClassVar[str]
    label: ClassVar[str]
    description: ClassVar[str] = ""
    ParamsModel: ClassVar[type[BaseModel]]

    def run(self, df: pd.DataFrame, raw_params: dict[str, Any]) -> OperationResult:
        """Validate params, then execute."""
        params = self.ParamsModel.model_validate(raw_params or {})
        return self.execute(df, params)

    @abstractmethod
    def execute(self, df: pd.DataFrame, params: BaseModel) -> OperationResult:
        raise NotImplementedError

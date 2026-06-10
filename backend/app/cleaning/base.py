from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, ClassVar

import pandas as pd
from pydantic import BaseModel


@dataclass
class OperationResult:
    """What every operation returns: the new DataFrame plus report metadata."""

    df: pd.DataFrame
    metadata: dict[str, Any] = field(default_factory=dict)


class CleaningOperation(ABC):
    """Common interface shared by every cleaning operation.

    Subclasses declare:
      - ``name``: the registry key the frontend sends,
      - ``ParamsModel``: a pydantic model validating this operation's params,
      - ``execute``: pure transformation returning an :class:`OperationResult`.
    """

    name: ClassVar[str]
    label: ClassVar[str]
    description: ClassVar[str] = ""
    ParamsModel: ClassVar[type[BaseModel]]

    def run(self, df: pd.DataFrame, raw_params: dict[str, Any]) -> OperationResult:
        """Validate params then execute. Called by the pipeline."""
        params = self.ParamsModel.model_validate(raw_params or {})
        return self.execute(df, params)

    @abstractmethod
    def execute(self, df: pd.DataFrame, params: BaseModel) -> OperationResult:
        """Transform ``df`` according to ``params`` and report what happened."""
        raise NotImplementedError

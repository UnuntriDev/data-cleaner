from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd

from app.cleaning.registry import OperationRegistry, registry
from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class StepReport:
    operation: str
    params: dict[str, Any]
    metadata: dict[str, Any]


@dataclass
class PipelineReport:
    rows_before: int
    columns_before: int
    missing_values_before: int
    duplicates_before: int
    rows_after: int = 0
    columns_after: int = 0
    missing_values_after: int = 0
    duplicates_after: int = 0
    steps: list[StepReport] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "rows_before": self.rows_before,
            "rows_after": self.rows_after,
            "columns_before": self.columns_before,
            "columns_after": self.columns_after,
            "missing_values_before": self.missing_values_before,
            "missing_values_after": self.missing_values_after,
            "duplicates_before": self.duplicates_before,
            "duplicates_after": self.duplicates_after,
            "operations": [
                {"operation": s.operation, "params": s.params, "metadata": s.metadata}
                for s in self.steps
            ],
            "summary": self._summary(),
        }

    def _summary(self) -> dict[str, Any]:
        """Roll up per-step metadata into totals."""
        removed_duplicates = 0
        handled_missing = 0
        type_conversion_errors = 0
        detected_outliers = 0
        for step in self.steps:
            meta = step.metadata
            removed_duplicates += meta.get("removed_duplicates", 0)
            handled_missing += meta.get("handled", 0)
            type_conversion_errors += sum(meta.get("conversion_errors", {}).values())
            detected_outliers += meta.get("total_outliers", 0)
        return {
            "removed_duplicates": removed_duplicates,
            "handled_missing_values": handled_missing,
            "type_conversion_errors": type_conversion_errors,
            "detected_outliers": detected_outliers,
            "rows_removed": max(self.rows_before - self.rows_after, 0),
            "columns_removed": max(self.columns_before - self.columns_after, 0),
        }


@dataclass
class PipelineOutcome:
    df: pd.DataFrame
    report: PipelineReport


class CleaningPipeline:
    """Runs user-selected operations in order, building a report."""

    def __init__(self, op_registry: OperationRegistry = registry) -> None:
        self._registry = op_registry

    def run(
        self, df: pd.DataFrame, steps: list[dict[str, Any]]
    ) -> PipelineOutcome:
        missing_before, duplicates_before = _quality_counts(df)
        report = PipelineReport(
            rows_before=int(len(df)),
            columns_before=int(df.shape[1]),
            missing_values_before=missing_before,
            duplicates_before=duplicates_before,
        )
        current = df
        for step in steps:
            name = step["operation"]
            params = step.get("params", {})
            operation = self._registry.get(name)
            logger.info("Running operation '%s'", name)
            result = operation.run(current, params)
            current = result.df
            report.steps.append(
                StepReport(operation=name, params=params, metadata=result.metadata)
            )

        report.rows_after = int(len(current))
        report.columns_after = int(current.shape[1])
        report.missing_values_after, report.duplicates_after = _quality_counts(current)
        return PipelineOutcome(df=current, report=report)


def _quality_counts(df: pd.DataFrame) -> tuple[int, int]:
    """(missing cells, duplicate rows) for the whole frame."""
    return int(df.isna().sum().sum()), int(df.duplicated().sum())

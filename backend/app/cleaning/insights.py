"""Data-quality detection: scan a DataFrame and return fixable issues."""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

import numpy as np
import pandas as pd

Step = dict[str, Any]

# progi wykrywania — zmień jeśli chcesz bardziej/mniej agresywne sugestie
_MISSING_FLAG_PCT = 30.0  # flag column at this % missing
_MISSING_DROP_PCT = 60.0  # suggest dropping column at this %
_NUMERIC_PARSE_RATIO = 0.9  # min share of parseable numeric values
_MIN_ROWS_FOR_OUTLIERS = 12  # IQR needs at least this many rows
_CLEAN_NAME = re.compile(r"^[a-z0-9_]+$")


@dataclass(frozen=True)
class Issue:
    code: str
    title: str
    detail: str
    severity: str  # "high" | "medium" | "low"
    count: int
    recommended: bool
    steps: list[Step]
    column: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "title": self.title,
            "detail": self.detail,
            "severity": self.severity,
            "count": self.count,
            "recommended": self.recommended,
            "steps": self.steps,
            "column": self.column,
        }


@dataclass
class _Collector:
    issues: list[Issue] = field(default_factory=list)

    def add(self, issue: Issue) -> None:
        self.issues.append(issue)


def analyze(df: pd.DataFrame) -> list[Issue]:
    out = _Collector()
    if df.empty:
        return []

    _detect_duplicates(df, out)
    _detect_messy_column_names(df, out)
    _detect_whitespace(df, out)
    _detect_text_numeric(df, out)
    _detect_high_missing(df, out)
    _detect_outliers(df, out)
    return out.issues


def _detect_duplicates(df: pd.DataFrame, out: _Collector) -> None:
    dupes = int(df.duplicated().sum())
    if dupes == 0:
        return
    out.add(
        Issue(
            code="duplicate_rows",
            title="Zduplikowane wiersze",
            detail=f"{dupes} powtórzonych wierszy. Zostanie zachowane pierwsze wystąpienie.",
            severity="medium",
            count=dupes,
            recommended=True,
            steps=[
                {
                    "operation": "remove_duplicates",
                    "params": {"subset": None, "keep": "first"},
                }
            ],
        )
    )


def _detect_messy_column_names(df: pd.DataFrame, out: _Collector) -> None:
    messy = [str(c) for c in df.columns if not _CLEAN_NAME.match(str(c))]
    if not messy:
        return
    sample = ", ".join(messy[:4]) + ("…" if len(messy) > 4 else "")
    out.add(
        Issue(
            code="messy_column_names",
            title="Niespójne nazwy kolumn",
            detail=f"{len(messy)} kolumn ma spacje, wielkie litery lub znaki "
            f"specjalne (np. {sample}). Zostaną ujednolicone do snake_case.",
            severity="low",
            count=len(messy),
            recommended=True,
            steps=[
                {
                    "operation": "clean_column_names",
                    "params": {
                        "lowercase": True,
                        "snake_case": True,
                        "remove_special": True,
                    },
                }
            ],
        )
    )


def _detect_whitespace(df: pd.DataFrame, out: _Collector) -> None:
    affected: list[str] = []
    cells = 0
    for col in _text_columns(df):
        s = df[col].dropna()
        if s.empty:
            continue
        as_str = s.astype(str)
        bad = (as_str != as_str.str.strip()) | (as_str.str.strip() == "")
        n = int(bad.sum())
        if n > 0:
            affected.append(str(col))
            cells += n
    if not affected:
        return
    out.add(
        Issue(
            code="whitespace_text",
            title="Zbędne spacje w tekście",
            detail=f"{cells} komórek w {len(affected)} kolumnach ma zbędne spacje "
            "lub jest pustych. Tekst zostanie przycięty, a puste wartości oznaczone "
            "jako brak.",
            severity="low",
            count=cells,
            recommended=True,
            steps=[
                {
                    "operation": "clean_text",
                    "params": {
                        "columns": affected,
                        "transforms": ["trim", "remove_empty"],
                    },
                }
            ],
        )
    )


def _detect_text_numeric(df: pd.DataFrame, out: _Collector) -> None:
    for col in _text_columns(df):
        s = df[col].dropna()
        if s.empty:
            continue
        parsed = pd.to_numeric(s, errors="coerce")
        ratio = float(parsed.notna().mean())
        if ratio < _NUMERIC_PARSE_RATIO or ratio == 0:
            continue
        valid = parsed.dropna()
        has_missing = bool(df[col].isna().any()) or ratio < 1.0
        all_int = bool((valid % 1 == 0).all())
        target = "int" if all_int and not has_missing else "float"
        pct = round(ratio * 100, 1)
        out.add(
            Issue(
                code="text_numeric",
                title="Liczby zapisane jako tekst",
                detail=f"Kolumna „{col}” zawiera liczby zapisane jako tekst "
                f"({pct}% wartości). Zostanie przekonwertowana na typ liczbowy.",
                severity="low",
                count=int(valid.shape[0]),
                recommended=True,
                column=str(col),
                steps=[
                    {
                        "operation": "convert_types",
                        "params": {"conversions": {str(col): target}},
                    }
                ],
            )
        )


def _detect_high_missing(df: pd.DataFrame, out: _Collector) -> None:
    rows = len(df)
    if rows == 0:
        return
    na_counts = df.isna().sum()
    for col in df.columns:
        missing = int(na_counts[col])
        if missing == 0:
            continue
        pct = missing / rows * 100
        if pct < _MISSING_FLAG_PCT:
            continue

        col_name = str(col)
        if pct >= _MISSING_DROP_PCT:
            out.add(
                Issue(
                    code="mostly_empty_column",
                    title="Niemal pusta kolumna",
                    detail=f"Kolumna „{col_name}” jest pusta w {round(pct, 1)}%. "
                    "Rekomendujemy usunięcie tej kolumny.",
                    severity="high",
                    count=missing,
                    recommended=False,
                    column=col_name,
                    steps=[
                        {
                            "operation": "handle_missing",
                            "params": {
                                "strategy": "drop_columns",
                                "columns": [col_name],
                            },
                        }
                    ],
                )
            )
            continue

        is_numeric = pd.api.types.is_numeric_dtype(df[col])
        strategy = "median" if is_numeric else "mode"
        how = "medianą" if is_numeric else "wartością najczęstszą"
        out.add(
            Issue(
                code="high_missing_column",
                title="Dużo brakujących wartości",
                detail=f"Kolumna „{col_name}” ma {missing} braków ({round(pct, 1)}%). "
                f"Zostaną uzupełnione {how}.",
                severity="medium",
                count=missing,
                recommended=True,
                column=col_name,
                steps=[
                    {
                        "operation": "handle_missing",
                        "params": {"strategy": strategy, "columns": [col_name]},
                    }
                ],
            )
        )


def _detect_outliers(df: pd.DataFrame, out: _Collector) -> None:
    if len(df) < _MIN_ROWS_FOR_OUTLIERS:
        return
    for col in df.select_dtypes(include=np.number).columns:
        values = df[col].dropna().astype("float64")
        if values.shape[0] < _MIN_ROWS_FOR_OUTLIERS:
            continue
        q1, q3 = values.quantile(0.25), values.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0 or np.isnan(iqr):
            continue
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        n = int(((values < lower) | (values > upper)).sum())
        if n == 0:
            continue
        col_name = str(col)
        out.add(
            Issue(
                code="numeric_outliers",
                title="Wartości odstające",
                detail=f"Kolumna „{col_name}” ma {n} wartości odstających (metoda IQR). "
                "Wiersze z nimi zostaną usunięte — odznacz, jeśli to celowe dane.",
                severity="low",
                count=n,
                recommended=False,
                column=col_name,
                steps=[
                    {
                        "operation": "detect_outliers",
                        "params": {
                            "method": "iqr",
                            "columns": [col_name],
                            "threshold": 1.5,
                            "action": "remove",
                        },
                    }
                ],
            )
        )


def _text_columns(df: pd.DataFrame) -> list[str]:
    return [
        c
        for c in df.columns
        if pd.api.types.is_object_dtype(df[c]) or pd.api.types.is_string_dtype(df[c])
    ]

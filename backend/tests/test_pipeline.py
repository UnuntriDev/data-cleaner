import pandas as pd
import pytest

from app.cleaning.pipeline import CleaningPipeline


def test_pipeline_runs_only_selected_operations(messy_df):
    pipeline = CleaningPipeline()
    steps = [
        {"operation": "clean_column_names", "params": {}},
        {"operation": "remove_duplicates", "params": {}},
        {"operation": "clean_text", "params": {"transforms": ["trim", "lowercase"]}},
    ]
    outcome = pipeline.run(messy_df, steps)

    assert outcome.report.rows_before == len(messy_df)
    assert outcome.report.rows_after == len(messy_df) - 1
    assert [s.operation for s in outcome.report.steps] == [
        "clean_column_names",
        "remove_duplicates",
        "clean_text",
    ]
    assert "name" in outcome.df.columns  # column names normalized


def test_pipeline_empty_steps_is_noop(messy_df):
    outcome = CleaningPipeline().run(messy_df, [])
    assert outcome.report.rows_after == outcome.report.rows_before
    assert outcome.report.missing_values_after == outcome.report.missing_values_before
    assert outcome.report.duplicates_after == outcome.report.duplicates_before
    assert outcome.report.steps == []


def test_pipeline_report_summary(messy_df):
    steps = [
        {"operation": "remove_duplicates", "params": {}},
        {"operation": "handle_missing", "params": {"strategy": "mean", "columns": ["Age"]}},
    ]
    report = CleaningPipeline().run(messy_df, steps).report.to_dict()
    assert report["summary"]["removed_duplicates"] == 1
    assert report["summary"]["handled_missing_values"] >= 1
    assert report["rows_before"] == len(messy_df)
    assert report["missing_values_before"] == int(messy_df.isna().sum().sum())
    assert report["missing_values_after"] <= report["missing_values_before"]
    assert report["duplicates_before"] == int(messy_df.duplicated().sum())
    assert report["duplicates_after"] == 0


def test_pipeline_unknown_operation_raises(messy_df):
    with pytest.raises(ValueError):
        CleaningPipeline().run(messy_df, [{"operation": "does_not_exist", "params": {}}])

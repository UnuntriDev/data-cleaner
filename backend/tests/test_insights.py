import pandas as pd

from app.cleaning.insights import analyze


def _by_code(issues):
    return {issue.code: issue for issue in issues}


def test_analyze_detects_fixable_quality_issues(messy_df):
    issues = _by_code(analyze(messy_df))

    assert "duplicate_rows" in issues
    assert issues["duplicate_rows"].steps[0]["operation"] == "remove_duplicates"

    assert "messy_column_names" in issues
    assert issues["messy_column_names"].steps[0]["operation"] == "clean_column_names"

    assert "whitespace_text" in issues
    text_step = issues["whitespace_text"].steps[0]
    assert text_step["operation"] == "clean_text"
    assert "trim" in text_step["params"]["transforms"]


def test_analyze_recommends_targeted_missing_value_fix():
    df = pd.DataFrame(
        {
            "id": [1, 2, 3, 4, 5],
            "score": [10.0, None, None, 12.0, None],
            "segment": ["A", "A", "B", "B", "B"],
        }
    )

    issues = analyze(df)
    missing = next(issue for issue in issues if issue.code == "mostly_empty_column")

    assert missing.column == "score"
    assert missing.recommended is False
    assert missing.steps == [
        {
            "operation": "handle_missing",
            "params": {"strategy": "drop_columns", "columns": ["score"]},
        }
    ]


def test_analyze_returns_no_issues_for_empty_frame():
    assert analyze(pd.DataFrame()) == []

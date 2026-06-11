import pandas as pd

from app.cleaning.operations.column_names import CleanColumnNamesOperation
from app.cleaning.operations.columns import (
    RemoveColumnsOperation,
    RenameColumnsOperation,
)
from app.cleaning.operations.dates import ParseDatesOperation
from app.cleaning.operations.duplicates import RemoveDuplicatesOperation
from app.cleaning.operations.filter_rows import FilterRowsOperation
from app.cleaning.operations.missing_values import HandleMissingOperation
from app.cleaning.operations.outliers import DetectOutliersOperation
from app.cleaning.operations.text_cleaning import CleanTextOperation
from app.cleaning.operations.type_conversion import ConvertTypesOperation


def test_remove_duplicates(messy_df):
    result = RemoveDuplicatesOperation().run(messy_df, {})
    assert result.metadata["removed_duplicates"] == 1
    assert len(result.df) == len(messy_df) - 1


def test_handle_missing_drop_rows(messy_df):
    result = HandleMissingOperation().run(
        messy_df, {"strategy": "drop_rows", "columns": ["Age"]}
    )
    assert result.df["Age"].isna().sum() == 0


def test_handle_missing_mean(messy_df):
    result = HandleMissingOperation().run(
        messy_df, {"strategy": "mean", "columns": ["Age"]}
    )
    assert result.df["Age"].isna().sum() == 0
    assert result.metadata["handled"] == 1


def test_handle_missing_custom_value(messy_df):
    result = HandleMissingOperation().run(
        messy_df, {"strategy": "custom", "columns": ["City"], "custom_value": "UNKNOWN"}
    )
    assert "UNKNOWN" not in result.df["City"].tolist()  # no NaN in City to fill
    # forward fill propagates the previous value into the trailing NaN
    ff = HandleMissingOperation().run(
        messy_df, {"strategy": "ffill", "columns": ["Joined"]}
    )
    assert ff.df["Joined"].iloc[-1] == ff.df["Joined"].iloc[-2]
    assert ff.df["Joined"].isna().sum() < messy_df["Joined"].isna().sum()


def test_convert_types_int_with_errors():
    df = pd.DataFrame({"x": ["1", "2", "abc", None]})
    result = ConvertTypesOperation().run(df, {"conversions": {"x": "int"}})
    assert result.metadata["conversion_errors"]["x"] == 1
    assert str(result.df["x"].dtype) == "Int64"


def test_convert_types_bool():
    df = pd.DataFrame({"flag": ["yes", "no", "true", "0", "maybe"]})
    result = ConvertTypesOperation().run(df, {"conversions": {"flag": "bool"}})
    assert result.df["flag"].tolist()[:4] == [True, False, True, False]
    assert result.metadata["conversion_errors"]["flag"] == 1


def test_clean_text_trim_and_lower(messy_df):
    result = CleanTextOperation().run(
        messy_df, {"columns": ["Name "], "transforms": ["trim", "lowercase"]}
    )
    assert result.df["Name "].iloc[0] == "alice"


def test_clean_text_remove_empty(messy_df):
    result = CleanTextOperation().run(
        messy_df, {"columns": ["City"], "transforms": ["trim", "remove_empty"]}
    )
    assert pd.isna(result.df["City"].iloc[3])


def test_clean_column_names():
    df = pd.DataFrame({"First Name": [1], "userID": [2], "E-mail!": [3]})
    result = CleanColumnNamesOperation().run(df, {})
    assert list(result.df.columns) == ["first_name", "user_id", "e_mail"]


def test_detect_outliers_iqr():
    df = pd.DataFrame({"v": [10, 11, 12, 13, 1000]})
    result = DetectOutliersOperation().run(
        df, {"method": "iqr", "action": "remove", "threshold": 1.5}
    )
    assert result.metadata["total_outliers"] == 1
    assert 1000 not in result.df["v"].tolist()


def test_detect_outliers_zscore():
    df = pd.DataFrame({"v": [10, 11, 12, 13, 1000]})
    result = DetectOutliersOperation().run(
        df, {"method": "zscore", "action": "flag", "threshold": 1.5}
    )
    assert result.metadata["total_outliers"] >= 1


def test_parse_dates(messy_df):
    result = ParseDatesOperation().run(
        messy_df, {"columns": ["Joined"], "output_format": "%Y-%m-%d"}
    )
    assert result.df["Joined"].iloc[0] == "2021-01-01"
    assert result.metadata["parse_failures"]["Joined"] == 1


def test_filter_rows():
    df = pd.DataFrame({"age": [10, 20, 30, 40]})
    result = FilterRowsOperation().run(
        df, {"column": "age", "operator": "ge", "value": 30, "keep_matching": True}
    )
    assert result.df["age"].tolist() == [30, 40]
    assert result.metadata["rows_removed"] == 2


def test_rename_and_remove_columns():
    df = pd.DataFrame({"a": [1], "b": [2], "c": [3]})
    renamed = RenameColumnsOperation().run(df, {"mapping": {"a": "alpha"}})
    assert "alpha" in renamed.df.columns
    removed = RemoveColumnsOperation().run(renamed.df, {"columns": ["b"]})
    assert "b" not in removed.df.columns

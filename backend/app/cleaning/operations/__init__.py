"""Each cleaning operation lives in its own module and is a single class
implementing :class:`app.cleaning.base.CleaningOperation`."""

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

ALL_OPERATIONS = [
    RemoveDuplicatesOperation,
    HandleMissingOperation,
    ConvertTypesOperation,
    CleanTextOperation,
    CleanColumnNamesOperation,
    DetectOutliersOperation,
    ParseDatesOperation,
    FilterRowsOperation,
    RenameColumnsOperation,
    RemoveColumnsOperation,
]

__all__ = ["ALL_OPERATIONS"]

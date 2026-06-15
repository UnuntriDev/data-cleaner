from __future__ import annotations

from dataclasses import dataclass

from app.cleaning.base import CleaningOperation
from app.cleaning.operations import ALL_OPERATIONS

# python type -> frontend-friendly hint
_TYPE_HINTS = {
    "str": "string",
    "int": "integer",
    "float": "number",
    "bool": "boolean",
    "list": "array",
    "dict": "object",
}


@dataclass(frozen=True)
class ParamSpec:
    name: str
    type: str
    required: bool
    description: str | None


@dataclass(frozen=True)
class OperationSpec:
    name: str
    label: str
    description: str
    params: list[ParamSpec]


class OperationRegistry:
    def __init__(self, operations: list[type[CleaningOperation]]) -> None:
        self._operations: dict[str, CleaningOperation] = {}
        for op_cls in operations:
            self._operations[op_cls.name] = op_cls()

    def get(self, name: str) -> CleaningOperation:
        try:
            return self._operations[name]
        except KeyError as exc:
            raise ValueError(f"Unknown operation: {name}") from exc

    def describe(self) -> list[OperationSpec]:
        specs: list[OperationSpec] = []
        for op in self._operations.values():
            params = [
                ParamSpec(
                    name=field_name,
                    type=_annotation_hint(field.annotation),
                    required=field.is_required(),
                    description=field.description,
                )
                for field_name, field in op.ParamsModel.model_fields.items()
            ]
            specs.append(
                OperationSpec(
                    name=op.name,
                    label=op.label,
                    description=op.description,
                    params=params,
                )
            )
        return specs


def _annotation_hint(annotation: object) -> str:
    name = getattr(annotation, "__name__", str(annotation))
    return _TYPE_HINTS.get(name, name)


registry = OperationRegistry(ALL_OPERATIONS)

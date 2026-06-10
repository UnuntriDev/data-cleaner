import type { OperationStep } from "./types";

export interface Preset {
  key: string;
  label: string;
  description: string;
  step: OperationStep;
  defaultOn: boolean;
}

// Curated, one-click cleaning operations, listed in execution order.
export const PRESETS: Preset[] = [
  {
    key: "clean_column_names",
    label: "Uporządkuj nazwy kolumn",
    description: "małe litery, snake_case, bez znaków specjalnych",
    step: {
      operation: "clean_column_names",
      params: { lowercase: true, snake_case: true, remove_special: true },
    },
    defaultOn: true,
  },
  {
    key: "trim_text",
    label: "Przytnij i wyczyść tekst",
    description: "usuwa zbędne spacje i puste napisy",
    step: {
      operation: "clean_text",
      params: { columns: null, transforms: ["trim", "remove_empty"] },
    },
    defaultOn: true,
  },
  {
    key: "drop_empty_rows",
    label: "Usuń puste wiersze",
    description: "wiersze z brakującymi wartościami",
    step: {
      operation: "handle_missing",
      params: { strategy: "drop_rows", columns: null },
    },
    defaultOn: false,
  },
  {
    key: "remove_duplicates",
    label: "Usuń duplikaty",
    description: "powtarzające się wiersze",
    step: { operation: "remove_duplicates", params: { keep: "first" } },
    defaultOn: true,
  },
  {
    key: "remove_outliers",
    label: "Usuń wartości odstające",
    description: "metoda IQR na kolumnach liczbowych",
    step: {
      operation: "detect_outliers",
      params: { method: "iqr", threshold: 1.5, action: "remove", columns: null },
    },
    defaultOn: false,
  },
];

export const DEFAULT_ENABLED: Record<string, boolean> = Object.fromEntries(
  PRESETS.map((p) => [p.key, p.defaultOn]),
);

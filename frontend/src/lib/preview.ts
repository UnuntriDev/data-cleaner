export const EMPTY_CELL = "—";

export type CellIssue = "empty" | "duplicate" | "invalid";

export interface QualityCounts {
  empty: number;
  duplicate: number;
  invalid: number;
}

export interface DiffInfo {
  changes: Map<number, Map<string, string>>;
  removedRows: number;
  changedCells: number;
}

export function renderCell(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_CELL;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function rowKey(row: Record<string, unknown>, columns: string[]): string {
  return JSON.stringify(columns.map((c) => row[c] ?? null));
}

export function findDuplicateRowKeys(
  rows: Record<string, unknown>[],
  columns: string[],
): Set<string> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = rowKey(row, columns);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set(
    [...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key),
  );
}

const EMAIL_COLUMN = /e-?mail/;
const NUMERIC_COLUMN =
  /(amount|total|price|qty|quantity|kwota|cena|pln|ilość|ilosc)/;
const EMAIL_VALUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ERROR_VALUE = /invalid|błęd|blad|error/i;

export function looksInvalid(column: string, value: string): boolean {
  if (value === EMPTY_CELL) return false;

  const normalizedColumn = column.toLowerCase();
  const trimmed = value.trim();

  if (
    EMAIL_COLUMN.test(normalizedColumn) &&
    trimmed &&
    !EMAIL_VALUE.test(trimmed)
  ) {
    return true;
  }

  if (ERROR_VALUE.test(trimmed)) return true;

  if (NUMERIC_COLUMN.test(normalizedColumn)) {
    const normalizedNumber = trimmed.replace(/\s/g, "").replace(",", ".");
    return normalizedNumber !== "" && Number.isNaN(Number(normalizedNumber));
  }

  return false;
}

export function classifyCell(
  column: string,
  value: string,
  duplicateRow: boolean,
): CellIssue | null {
  if (value === EMPTY_CELL) return "empty";
  if (looksInvalid(column, value)) return "invalid";
  if (duplicateRow) return "duplicate";
  return null;
}

export function computeQualityCounts(
  rows: Record<string, unknown>[],
  columns: string[],
  duplicateKeys: Set<string>,
): QualityCounts {
  const counts: QualityCounts = { empty: 0, duplicate: 0, invalid: 0 };

  for (const row of rows) {
    const duplicateRow = duplicateKeys.has(rowKey(row, columns));
    for (const column of columns) {
      const issue = classifyCell(column, renderCell(row[column]), duplicateRow);
      if (issue) counts[issue] += 1;
    }
  }

  return counts;
}

export function sameColumns(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((c, i) => c === b[i]);
}

// dopasowanie zachłanne: każdemu czystemu wierszowi przypisujemy surowy
// z największą liczbą wspólnych komórek; nieprzypisane surowe = usunięte
export function computeDiff(
  rawRows: Record<string, unknown>[],
  cleanRows: Record<string, unknown>[],
  columns: string[],
): DiffInfo {
  const changes = new Map<number, Map<string, string>>();
  const used = new Set<number>();
  let changedCells = 0;

  for (let ci = 0; ci < cleanRows.length; ci++) {
    const cleanRow = cleanRows[ci];
    let bestIdx = -1;
    let bestScore = -1;
    for (let ri = 0; ri < rawRows.length; ri++) {
      if (used.has(ri)) continue;
      let score = 0;
      for (const col of columns) {
        if (renderCell(rawRows[ri][col]) === renderCell(cleanRow[col])) {
          score += 1;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = ri;
        if (score === columns.length) break;
      }
    }
    if (bestIdx < 0) continue;
    used.add(bestIdx);
    const rawRow = rawRows[bestIdx];
    const rowChanges = new Map<string, string>();
    for (const col of columns) {
      const oldVal = renderCell(rawRow[col]);
      const newVal = renderCell(cleanRow[col]);
      if (oldVal !== newVal) rowChanges.set(col, oldVal);
    }
    if (rowChanges.size > 0) {
      changes.set(ci, rowChanges);
      changedCells += rowChanges.size;
    }
  }

  return { changes, removedRows: rawRows.length - used.size, changedCells };
}

import { m } from "framer-motion";
import { useMemo, useState } from "react";
import type { DataPreview } from "../types";
import { useScrollAffordance } from "../hooks/useScrollAffordance";
import { Columns, Rows, Search } from "./icons";

interface DataPreviewTableProps {
  preview: DataPreview;
  title?: string;
  tone?: "neutral" | "clean";
}

type CellIssue = "empty" | "duplicate" | "invalid";

function renderCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function rowKey(row: Record<string, unknown>, columns: string[]): string {
  return JSON.stringify(columns.map((c) => row[c] ?? null));
}

function looksInvalid(column: string, value: string): boolean {
  if (value === "—") return false;

  const normalizedColumn = column.toLowerCase();
  const trimmed = value.trim();
  const isEmail = /e-?mail/.test(normalizedColumn);
  const isNumeric =
    /(amount|total|price|qty|quantity|kwota|cena|pln|ilość|ilosc)/.test(
      normalizedColumn,
    );

  if (isEmail && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return true;
  }

  if (/invalid|błęd|blad|error/i.test(trimmed)) {
    return true;
  }

  if (isNumeric) {
    const normalizedNumber = trimmed.replace(/\s/g, "").replace(",", ".");
    return normalizedNumber !== "" && Number.isNaN(Number(normalizedNumber));
  }

  return false;
}

function classifyCell(
  column: string,
  value: string,
  duplicateRow: boolean,
): CellIssue | null {
  if (value === "—") return "empty";
  if (looksInvalid(column, value)) return "invalid";
  if (duplicateRow) return "duplicate";
  return null;
}

const issueClasses: Record<CellIssue, string> = {
  empty: "bg-amber-50/80 text-amber-700 ring-1 ring-inset ring-amber-100",
  duplicate: "bg-coral-50/55 text-coral-800",
  invalid: "bg-red-50/80 text-red-700 ring-1 ring-inset ring-red-100",
};

export function DataPreviewTable({
  preview,
  title = "Podgląd danych",
  tone = "neutral",
}: DataPreviewTableProps) {
  const { columns, rows, total_rows } = preview;
  const [query, setQuery] = useState("");
  const showQualityHints = tone === "neutral";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((c) => renderCell(row[c]).toLowerCase().includes(q)),
    );
  }, [query, rows, columns]);

  const duplicateRows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const key = rowKey(row, columns);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set(
      [...counts.entries()]
        .filter(([, count]) => count > 1)
        .map(([key]) => key),
    );
  }, [rows, columns]);

  const qualityCounts = useMemo(() => {
    const counts: Record<CellIssue, number> = {
      empty: 0,
      duplicate: 0,
      invalid: 0,
    };

    if (!showQualityHints) return counts;

    for (const row of rows) {
      const duplicateRow = duplicateRows.has(rowKey(row, columns));
      for (const column of columns) {
        const issue = classifyCell(
          column,
          renderCell(row[column]),
          duplicateRow,
        );
        if (issue) counts[issue] += 1;
      }
    }

    return counts;
  }, [columns, duplicateRows, rows, showQualityHints]);

  const accent = tone === "clean" ? "text-emerald-600" : "text-coral-500";

  const { ref: scrollRef, affordance } = useScrollAffordance<HTMLDivElement>([
    columns.length,
    filtered.length,
  ]);

  return (
    <div className="glass-strong overflow-hidden rounded-2xl shadow-lift ring-1 ring-white/60">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-sand-300/60 bg-cream-100/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-ink-600 ring-1 ring-sand-300">
            <Rows className={`h-3.5 w-3.5 ${accent}`} />
            {total_rows.toLocaleString("pl-PL")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-ink-600 ring-1 ring-sand-300">
            <Columns className={`h-3.5 w-3.5 ${accent}`} />
            {columns.length}
          </span>
        </div>

        <div className="relative sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj w danych..."
            className="w-full rounded-xl border border-sand-300 bg-white/80 py-2 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 outline-none transition-colors focus:border-coral-400 focus:ring-2 focus:ring-coral-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="scroll-soft min-h-[29rem] max-h-[34rem] overflow-auto"
        >
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-cream-200/95 backdrop-blur">
                {columns.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-4 py-3 font-semibold text-ink-700"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const duplicateRow =
                  showQualityHints && duplicateRows.has(rowKey(row, columns));
                return (
                  <m.tr
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: Math.min(i * 0.012, 0.35),
                      duration: 0.25,
                    }}
                    className={[
                      "border-t border-sand-300/50 odd:bg-white/30 hover:bg-coral-50/60",
                      duplicateRow ? "bg-coral-50/25" : "",
                    ].join(" ")}
                  >
                    {columns.map((c) => {
                      const value = renderCell(row[c]);
                      const empty = value === "—";
                      const issue = showQualityHints
                        ? classifyCell(c, value, duplicateRow)
                        : null;
                      return (
                        <td
                          key={c}
                          className={[
                            "whitespace-nowrap px-4 py-3.5 tabular-nums",
                            issue
                              ? issueClasses[issue]
                              : empty
                                ? "italic text-ink-400"
                                : "text-ink-700",
                          ].join(" ")}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </m.tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={Math.max(columns.length, 1)}
                    className="px-4 py-24 text-center text-sm text-ink-400"
                  >
                    {query
                      ? `Brak wyników dla "${query}"`
                      : "Brak wierszy do wyświetlenia"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edge fades — only visible when there's hidden content that way.
            pointer-events-none so they never block scrolling or clicks. */}
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-cream-100 to-transparent transition-opacity duration-200",
            affordance.canScrollLeft ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-cream-100 to-transparent transition-opacity duration-200",
            affordance.canScrollRight ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 border-t border-sand-300/60 bg-cream-100/60 px-4 py-2.5 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Widocznych {filtered.length.toLocaleString("pl-PL")} z{" "}
          {total_rows.toLocaleString("pl-PL")} wierszy
        </span>
        {showQualityHints && (
          <span className="flex flex-wrap gap-1.5">
            <IssueBadge
              label="Braki"
              value={qualityCounts.empty}
              tone="empty"
            />
            <IssueBadge
              label="Duplikaty"
              value={qualityCounts.duplicate}
              tone="duplicate"
            />
            <IssueBadge
              label="Błędne"
              value={qualityCounts.invalid}
              tone="invalid"
            />
          </span>
        )}
      </div>
    </div>
  );
}

function IssueBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: CellIssue;
}) {
  const classes: Record<CellIssue, string> = {
    empty: "bg-amber-50 text-amber-700 ring-amber-100",
    duplicate: "bg-coral-50 text-coral-700 ring-coral-100",
    invalid: "bg-red-50 text-red-700 ring-red-100",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold ring-1 ${classes[tone]}`}
    >
      <span className="tabular-nums">{value.toLocaleString("pl-PL")}</span>
      {label}
    </span>
  );
}

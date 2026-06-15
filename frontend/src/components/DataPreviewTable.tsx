import { m } from "framer-motion";
import { useMemo, useState } from "react";
import type { DataPreview } from "../types";
import { useScrollAffordance } from "../hooks/useScrollAffordance";
import {
  type CellIssue,
  type DiffInfo,
  classifyCell,
  computeDiff,
  computeQualityCounts,
  EMPTY_CELL,
  findDuplicateRowKeys,
  renderCell,
  rowKey,
  sameColumns,
} from "../lib/preview";
import { Columns, Rows, Search } from "./icons";

interface DataPreviewTableProps {
  preview: DataPreview;
  title?: string;
  tone?: "neutral" | "clean";
  /** Source preview shown next to a cleaned one. When set, the table
   *  highlights cells that changed between source and cleaned. */
  comparePreview?: DataPreview | null;
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
  comparePreview = null,
}: DataPreviewTableProps) {
  const { columns, rows, total_rows } = preview;
  const [query, setQuery] = useState("");
  const [showDiff, setShowDiff] = useState(true);
  const showQualityHints = tone === "neutral";

  const diff = useMemo<DiffInfo | null>(() => {
    // require identical column shape — otherwise alignment is meaningless
    if (!comparePreview || !sameColumns(comparePreview.columns, columns)) {
      return null;
    }
    return computeDiff(comparePreview.rows, rows, columns);
  }, [columns, rows, comparePreview]);

  const diffActive = !!diff && showDiff;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const indexed = rows.map((row, idx) => ({ row, idx }));
    if (!q) return indexed;
    return indexed.filter(({ row }) =>
      columns.some((c) => renderCell(row[c]).toLowerCase().includes(q)),
    );
  }, [query, rows, columns]);

  const duplicateRows = useMemo(
    () => findDuplicateRowKeys(rows, columns),
    [rows, columns],
  );

  const qualityCounts = useMemo(
    () =>
      showQualityHints
        ? computeQualityCounts(rows, columns, duplicateRows)
        : { empty: 0, duplicate: 0, invalid: 0 },
    [columns, duplicateRows, rows, showQualityHints],
  );

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

        <div className="flex items-center gap-2.5">
          {diff && diff.changedCells > 0 && (
            <button
              type="button"
              onClick={() => setShowDiff((v) => !v)}
              aria-pressed={showDiff}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-colors",
                showDiff
                  ? "bg-emerald-500 text-white ring-emerald-500 hover:bg-emerald-600"
                  : "bg-white/70 text-ink-600 ring-sand-300 hover:text-emerald-700 hover:ring-emerald-200",
              ].join(" ")}
              title={
                showDiff
                  ? "Ukryj podświetlenie zmienionych komórek"
                  : "Pokaż zmienione komórki"
              }
            >
              <span
                aria-hidden
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  showDiff ? "bg-white" : "bg-emerald-500",
                ].join(" ")}
              />
              {showDiff ? "Zmiany widoczne" : "Pokaż zmiany"}
            </button>
          )}
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
              {filtered.map(({ row, idx }, i) => {
                const duplicateRow =
                  showQualityHints && duplicateRows.has(rowKey(row, columns));
                const rowDiff = diffActive ? diff?.changes.get(idx) : undefined;
                return (
                  <m.tr
                    key={idx}
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
                      const empty = value === EMPTY_CELL;
                      const issue = showQualityHints
                        ? classifyCell(c, value, duplicateRow)
                        : null;
                      const changedFrom = rowDiff?.get(c);
                      const isChanged = changedFrom !== undefined;
                      return (
                        <td
                          key={c}
                          title={
                            isChanged
                              ? `Wcześniej: ${changedFrom}`
                              : undefined
                          }
                          className={[
                            "whitespace-nowrap px-4 py-3.5 tabular-nums",
                            isChanged
                              ? "bg-emerald-50/80 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                              : issue
                                ? issueClasses[issue]
                                : empty
                                  ? "italic text-ink-400"
                                  : "text-ink-700",
                          ].join(" ")}
                        >
                          {isChanged ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                aria-hidden
                                className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                              />
                              {value}
                            </span>
                          ) : (
                            value
                          )}
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
        {diff && (diff.changedCells > 0 || diff.removedRows > 0) && (
          <span className="flex flex-wrap gap-1.5">
            {diff.changedCells > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <span className="tabular-nums">
                  {diff.changedCells.toLocaleString("pl-PL")}
                </span>
                naprawione
              </span>
            )}
            {diff.removedRows > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral-50 px-2 py-1 font-semibold text-coral-700 ring-1 ring-coral-100">
                <span className="tabular-nums">
                  {diff.removedRows.toLocaleString("pl-PL")}
                </span>
                wierszy usuniętych
              </span>
            )}
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

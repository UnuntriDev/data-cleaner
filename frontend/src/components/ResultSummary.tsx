import { m } from "framer-motion";
import type { Report } from "../types";
import { AnimatedNumber } from "./AnimatedNumber";
import { ArrowRight, Check, Download } from "./icons";

interface ResultSummaryProps {
  report: Report;
  fileName?: string | null;
  onDownload: (format: string) => void;
}

const FORMATS: { format: string; label: string; extension: string }[] = [
  { format: "csv", label: "CSV", extension: "csv" },
  { format: "excel", label: "XLSX", extension: "xlsx" },
  { format: "json", label: "JSON", extension: "json" },
];

const SUMMARY_LABELS: Record<string, string> = {
  rows_removed: "Usunięte wiersze",
  columns_removed: "Usunięte kolumny",
  removed_duplicates: "Usunięte duplikaty",
  detected_outliers: "Wartości odstające",
  handled_missing_values: "Uzupełnione braki",
  type_conversion_errors: "Błędy konwersji typów",
};

const NON_NEGATIVE_SUMMARY_KEYS = new Set(["rows_removed", "columns_removed"]);

const prettify = (key: string) => SUMMARY_LABELS[key] ?? key.replace(/_/g, " ");

const count = (value: number | undefined) =>
  Number.isFinite(value) ? Math.max(0, Number(value)) : 0;

function positiveSummary(summary: Record<string, number>) {
  return Object.entries(summary)
    .map(([key, value]) => [
      key,
      NON_NEGATIVE_SUMMARY_KEYS.has(key) ? Math.max(0, value) : value,
    ] as const)
    .filter(([, value]) => Number.isFinite(value) && value > 0);
}

function exportFileName(fileName: string | null | undefined, extension: string) {
  const base = (fileName?.trim() || "dataset")
    .replace(/\.[^/.\\]+$/, "")
    .replace(/\s+/g, "_");
  return `${base}_cleaned.${extension}`;
}

export function ResultSummary({
  report,
  fileName,
  onDownload,
}: ResultSummaryProps) {
  const p = report.payload;
  const summary = positiveSummary(p.summary);
  const metrics = [
    { label: "Wiersze", before: count(p.rows_before), after: count(p.rows_after) },
    {
      label: "Kolumny",
      before: count(p.columns_before),
      after: count(p.columns_after),
    },
    {
      label: "Braki",
      before: count(p.missing_values_before),
      after: count(p.missing_values_after),
    },
    {
      label: "Duplikaty",
      before: count(p.duplicates_before),
      after: count(p.duplicates_after),
    },
  ];

  return (
    <m.div
      initial={{ opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="glass-strong overflow-hidden rounded-3xl shadow-lift ring-1 ring-white/60"
    >
      {/* Success banner */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50 via-emerald-50/60 to-cream-100 px-6 py-5">
        <m.span
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 460, damping: 18, delay: 0.1 }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-soft"
        >
          <Check className="h-6 w-6" strokeWidth={3} />
        </m.span>
        <div>
          <p className="font-display text-lg font-bold text-ink-900">
            Dane wyczyszczone
          </p>
          <p className="text-sm text-ink-500">
            Gotowe do pobrania w wybranym formacie
          </p>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Before / after comparison */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <ComparisonMetric key={metric.label} index={index} {...metric} />
          ))}
        </div>

        {/* Summary chips */}
        {summary.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {summary.map(([key, value], i) => (
              <m.span
                key={key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1.5 text-xs font-medium text-coral-700 ring-1 ring-coral-100"
              >
                <span className="font-bold tabular-nums">{value}</span>
                {prettify(key)}
              </m.span>
            ))}
          </div>
        )}

        {/* Download */}
        <div>
          <div className="mb-2.5">
            <p className="text-sm font-semibold text-ink-700">
              Pobierz wyczyszczony plik
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              Wybierz format eksportu. Nazwa pliku zostanie uzupełniona o
              {" "}
              <span className="font-semibold text-ink-600">_cleaned</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {FORMATS.map(({ format, label, extension }) => (
              <m.button
                key={format}
                type="button"
                onClick={() => onDownload(format)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className="sheen relative inline-flex flex-1 basis-36 items-center justify-center rounded-xl bg-gradient-to-br from-coral-500 to-coral-600 px-4 py-3 text-sm font-semibold text-white shadow-glow transition-colors duration-200 hover:to-coral-700"
              >
                <Download className="absolute left-4 h-4 w-4" />
                <span className="flex flex-col items-center leading-tight">
                  <span>{label}</span>
                  <span className="mt-0.5 max-w-28 truncate text-[0.65rem] font-medium text-white/75">
                    {exportFileName(fileName, extension)}
                  </span>
                </span>
              </m.button>
            ))}
          </div>
        </div>
      </div>
    </m.div>
  );
}

interface ComparisonMetricProps {
  label: string;
  before: number;
  after: number;
  index: number;
}

function ComparisonMetric({ label, before, after, index }: ComparisonMetricProps) {
  const delta = after - before;
  const changed = delta !== 0;
  const deltaClass = delta <= 0 ? "text-emerald-600" : "text-amber-600";

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.04 }}
      className="rounded-2xl bg-white/62 p-4 ring-1 ring-sand-300/70"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <MetricValue label="Przed" value={before} muted />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-coral-100 text-coral-600">
          <ArrowRight className="h-4 w-4" />
        </span>
        <MetricValue label="Po" value={after} />
      </div>
      <p
        className={[
          "mt-3 min-h-4 text-xs font-semibold tabular-nums",
          changed ? deltaClass : "text-ink-400",
        ].join(" ")}
      >
        {changed
          ? `${delta > 0 ? "+" : "−"}${Math.abs(delta).toLocaleString("pl-PL")}`
          : "bez zmian"}
      </p>
    </m.div>
  );
}

function MetricValue({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </p>
      <span
        className={[
          "font-display text-xl font-bold tabular-nums",
          muted ? "text-ink-500" : "text-ink-900",
        ].join(" ")}
      >
        <AnimatedNumber value={value} />
      </span>
    </div>
  );
}

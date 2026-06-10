import { m } from "framer-motion";
import type { DatasetStats } from "../types";
import { SummaryCard, type SummaryTone } from "./SummaryCard";

interface FileStatsCardProps {
  stats: DatasetStats;
}

interface Metric {
  label: string;
  value: number;
  description: string;
  tone: SummaryTone;
  status?: string;
  format?: (n: number) => string;
}

const formatInt = (n: number) => Math.round(n).toLocaleString("pl-PL");
const formatPct = (n: number) =>
  `${n.toLocaleString("pl-PL", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

function buildMetrics(s: DatasetStats): Metric[] {
  const missingClean = s.missing_cells === 0;
  const dupClean = s.duplicate_rows === 0;
  return [
    {
      label: "Wiersze",
      value: s.rows,
      description: "wczytane rekordy",
      tone: "neutral",
    },
    {
      label: "Kolumny",
      value: s.columns,
      description: "pola w zbiorze",
      tone: "neutral",
    },
    {
      // Headline shows the share of missing cells (e.g. "9,3%"); the
      // description carries the absolute counts for context.
      label: "Braki danych",
      value: s.missing_pct,
      format: formatPct,
      description: missingClean
        ? "komplet danych"
        : `${formatInt(s.missing_cells)} komórek · ${s.columns_with_missing} kol.`,
      tone: missingClean ? "good" : "warn",
      status: missingClean ? "Czysto" : "Uwaga",
    },
    {
      label: "Duplikaty",
      value: s.duplicate_rows,
      description: dupClean ? "brak powtórzeń" : "powtórzone wiersze",
      tone: dupClean ? "good" : "warn",
      status: dupClean ? "Czysto" : "Uwaga",
    },
  ];
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
};

export function FileStatsCard({ stats }: FileStatsCardProps) {
  const metrics = buildMetrics(stats);
  return (
    <m.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {metrics.map((metric) => (
        <m.div key={metric.label} variants={item} className="h-full">
          <SummaryCard {...metric} />
        </m.div>
      ))}
    </m.div>
  );
}

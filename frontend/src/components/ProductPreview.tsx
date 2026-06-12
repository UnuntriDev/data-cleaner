import { m } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import { Alert, Check, Copy, Inbox } from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Stat {
  icon: Icon;
  label: string;
  value: string;
  tone: "warn" | "good";
}

const STATS: Stat[] = [
  { icon: Copy, label: "Duplikaty", value: "12", tone: "warn" },
  { icon: Inbox, label: "Puste pola", value: "34", tone: "warn" },
  { icon: Alert, label: "Błędne wartości", value: "8", tone: "warn" },
  { icon: Check, label: "Sprawdzone wiersze", value: "1,200", tone: "good" },
];

const COLUMNS = ["ID", "Imię i nazwisko", "Email", "Kwota"];

interface Row {
  id: string;
  name: string;
  email: string;
  amount: string;
  issue?: "empty" | "duplicate" | "invalid";
}

const ROWS: Row[] = [
  { id: "01", name: "Anna Kowalska", email: "anna@example.com", amount: "1200" },
  { id: "02", name: "Piotr Nowak", email: "piotr@example.com", amount: "980" },
  { id: "03", name: "Maria Wiśniewska", email: "—", amount: "2450", issue: "empty" },
  {
    id: "05",
    name: "Ewa Zając",
    email: "ewa@example.com",
    amount: "1750",
    issue: "duplicate",
  },
  { id: "12", name: "Magdalena Dąbrowska", email: "magda@example.com", amount: "abc", issue: "invalid" },
];

/** Static marketing mock: fake dataset with quality stats and sample rows. */
export function ProductPreview() {
  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 22 }}
      className="glass-strong overflow-hidden rounded-3xl shadow-lift ring-1 ring-white/60"
    >
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-sand-300/60 px-5 py-3.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
        </span>
        <span className="text-sm font-medium text-ink-500">klienci-demo.csv</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Przykładowa analiza
        </span>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
        {STATS.map((stat) => (
          <StatTile key={stat.label} {...stat} />
        ))}
      </div>

      {/* table */}
      <div className="px-5 pb-5">
        <div className="overflow-hidden rounded-2xl ring-1 ring-sand-300/60">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-cream-100/70 text-[0.68rem] font-semibold uppercase tracking-wider text-ink-400">
                {COLUMNS.map((col) => (
                  <th key={col} className="px-3 py-2.5 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t border-sand-300/50 ${
                    row.issue === "duplicate" ? "bg-amber-50/60" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 tabular-nums text-ink-400">{row.id}</td>
                  <td className="px-3 py-2.5 font-medium text-ink-800">{row.name}</td>
                  <td
                    className={`px-3 py-2.5 ${
                      row.issue === "empty"
                        ? "font-medium text-amber-600"
                        : "text-ink-600"
                    }`}
                  >
                    {row.email}
                  </td>
                  <td
                    className={`px-3 py-2.5 tabular-nums ${
                      row.issue === "invalid"
                        ? "font-semibold text-red-500"
                        : "text-ink-600"
                    }`}
                  >
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </m.div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: Stat) {
  const accent =
    tone === "good"
      ? "bg-emerald-50 text-emerald-600"
      : "bg-coral-50 text-coral-600";
  return (
    <div className="rounded-2xl bg-white/60 p-3 ring-1 ring-sand-300/50">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2.5 font-display text-xl font-bold tabular-nums text-ink-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs leading-tight text-ink-500">{label}</p>
    </div>
  );
}

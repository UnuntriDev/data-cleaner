import { AnimatedNumber } from "./AnimatedNumber";

export type SummaryTone = "neutral" | "good" | "warn";

interface SummaryCardProps {
  /** Short uppercase label, e.g. "Wiersze". */
  label: string;
  /** Headline numeric value. */
  value: number;
  /** One-line supporting detail. */
  description: string;
  /** Drives accent colour; only "warn" tints the card to draw attention. */
  tone?: SummaryTone;
  /** Optional status pill in the top-right, e.g. "Czysto" / "Uwaga". */
  status?: string;
  /** Optional value formatter (e.g. render a percentage). */
  format?: (n: number) => string;
}

const TONES: Record<SummaryTone, { card: string; value: string; pill: string }> = {
  neutral: {
    card: "glass-strong ring-1 ring-sand-300/70",
    value: "text-ink-900",
    pill: "bg-cream-200 text-ink-500",
  },
  good: {
    card: "glass-strong ring-1 ring-emerald-200/70",
    value: "text-ink-900",
    pill: "bg-emerald-100 text-emerald-700",
  },
  warn: {
    // Soft amber wash — attention without the harsh "yellow" look.
    card: "bg-amber-50/70 ring-1 ring-amber-200/70",
    value: "text-amber-700",
    pill: "bg-amber-100/80 text-amber-700",
  },
};

/**
 * A single dashboard metric tile. Presentational and reusable: it owns no
 * animation or data logic, just a consistent label / value / description
 * layout with an optional status pill. `h-full` + a fixed-height header keep a
 * row of cards aligned (equal height, shared value baseline) regardless of
 * label or description length, and `overflow-hidden` stops any rare long value
 * from spilling outside the card.
 */
export function SummaryCard({
  label,
  value,
  description,
  tone = "neutral",
  status,
  format,
}: SummaryCardProps) {
  const t = TONES[tone];
  return (
    <div
      className={`relative flex h-full min-w-0 flex-col items-center overflow-hidden rounded-xl p-5 text-center shadow-soft ${t.card}`}
    >
      {status && (
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${t.pill}`}
        >
          {status}
        </span>
      )}
      <span className="min-h-6 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <p
        className={`mt-3 font-display text-3xl font-bold leading-none tabular-nums ${t.value}`}
      >
        <AnimatedNumber value={value} format={format} />
      </p>
      <p className="mt-2 text-xs leading-relaxed text-ink-500">{description}</p>
    </div>
  );
}

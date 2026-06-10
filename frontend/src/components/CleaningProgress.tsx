import { m } from "framer-motion";
import { Check, Wand } from "./icons";

interface CleaningProgressProps {
  labels: string[];
  durationMs?: number;
}

export function CleaningProgress({
  labels,
  durationMs = 5_000,
}: CleaningProgressProps) {
  const durationSeconds = durationMs / 1000;
  const stepDelay =
    labels.length > 1 ? Math.max(durationSeconds - 0.8, 0) / (labels.length - 1) : 0;

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-8 shadow-lift ring-1 ring-white/60">
      <div className="pointer-events-none absolute inset-0 grid-dots opacity-30" />

      <div className="relative flex items-center gap-4">
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
          <m.span
            className="absolute inset-0 rounded-2xl ring-2 ring-coral-400"
            animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.25, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
          <Wand className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-lg font-bold text-ink-900">
            Czyszczenie danych...
          </p>
          <p className="text-sm text-ink-500">
            Stosuję {labels.length}{" "}
            {labels.length === 1 ? "operację" : "operacji"} w kolejności
          </p>
        </div>
      </div>

      {/* Determinate progress, synced with the minimum cleaning duration. */}
      <div className="relative mt-6 h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
        <m.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-coral-400 via-coral-500 to-coral-600 shadow-[0_0_18px_rgba(99,81,231,0.35)]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{
            duration: durationSeconds,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
        <m.span
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(99,81,231,0.45)] ring-2 ring-coral-300"
          initial={{ left: "0%" }}
          animate={{ left: "calc(100% - 1rem)" }}
          transition={{
            duration: durationSeconds,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      </div>

      {/* Sequential steps */}
      <ul className="relative mt-6 space-y-2.5">
        {labels.map((label, i) => (
          <m.li
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * stepDelay, duration: 0.35 }}
            className="flex items-center gap-3 text-sm text-ink-700"
          >
            <m.span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-100 text-coral-600"
              initial={{ scale: 0.6, opacity: 0.5 }}
              animate={{ scale: [0.6, 1, 1], opacity: [0.5, 1, 1] }}
              transition={{ delay: i * stepDelay, duration: 0.5 }}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </m.span>
            {label}
          </m.li>
        ))}
      </ul>
    </div>
  );
}

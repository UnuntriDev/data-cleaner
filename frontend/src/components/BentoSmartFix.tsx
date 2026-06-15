import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { Check, Sparkles, Wand } from "./icons";

/**
 * Interactive bento tile: a real before/after toggle. Clicking "Uruchom
 * Smart Fix" transforms the messy mini-dataset into its cleaned form and
 * back. All state-driven (no infinite animation).
 */

interface DemoRow {
  email: string;
  dirty: string;
  clean: string;
  removed?: boolean;
}

const DEMO: DemoRow[] = [
  { email: "john.smith @email.com", dirty: "john.smith @email.com", clean: "john.smith@email.com" },
  { email: "anna.weber", dirty: "anna.weber", clean: "anna.weber@company.de" },
  { email: "bob@test", dirty: "bob@test", clean: "bob@test.org", removed: true },
  { email: "carol_green CAROL_GREEN", dirty: "carol_green CAROL_GREEN", clean: "carol.green@corp.io" },
];

export function BentoSmartFix() {
  const reduce = useReducedMotion();
  const [fixed, setFixed] = useState(false);
  const problems = fixed ? 0 : 3;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-700 text-white shadow-glow">
          <Wand className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-ink-900">
            Smart Fix
          </h3>
          <p className="text-sm text-ink-500">Wypróbuj — kliknij i zobacz</p>
        </div>
        <span
          className={[
            "ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-colors",
            problems === 0
              ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
              : "bg-rose-50 text-rose-500 ring-1 ring-rose-100",
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              problems === 0 ? "bg-emerald-500" : "bg-rose-500",
            ].join(" ")}
          />
          {problems === 0 ? "0 problemów" : `${problems} problemy`}
        </span>
      </div>

      {/* mini table */}
      <div className="mt-5 flex-1 rounded-2xl bg-white/55 p-2 ring-1 ring-sand-300/50">
        {DEMO.map((row) => {
          const gone = fixed && row.removed;
          const isProblem = row.dirty !== row.clean || row.removed;
          return (
            <div
              key={row.email}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm"
            >
              <span
                className={[
                  "min-w-0 flex-1 truncate",
                  gone ? "text-ink-400 line-through" : "text-ink-700",
                ].join(" ")}
              >
                {row.email}
              </span>
              <span className="w-16 text-right tabular-nums">
                <AnimatePresence mode="wait" initial={false}>
                  <m.span
                    key={fixed ? "clean" : "dirty"}
                    initial={reduce ? false : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: 4 }}
                    transition={{ duration: 0.22 }}
                    className={
                      gone
                        ? "text-ink-400 line-through"
                        : fixed && isProblem
                          ? "font-semibold text-emerald-600"
                          : !fixed && isProblem
                            ? "font-semibold text-rose-500"
                            : "text-ink-600"
                    }
                  >
                    {fixed ? (gone ? "usunięto" : row.clean) : row.dirty}
                  </m.span>
                </AnimatePresence>
              </span>
              <span className="flex w-5 justify-center">
                {fixed ? (
                  <m.span
                    initial={reduce ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 360, damping: 18 }}
                  >
                    <Check className="h-4 w-4 text-emerald-500" />
                  </m.span>
                ) : isProblem ? (
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                ) : (
                  <Check className="h-4 w-4 text-ink-400/50" />
                )}
              </span>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setFixed((f) => !f)}
        className={[
          "sheen mt-4 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors duration-200",
          fixed
            ? "glass-strong text-ink-700 ring-1 ring-sand-300 hover:text-coral-700 hover:ring-coral-300"
            : "bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-glow hover:to-coral-700",
        ].join(" ")}
      >
        {fixed ? (
          <>
            <Sparkles className="h-4 w-4" />
            Pokaż dane wejściowe
          </>
        ) : (
          <>
            <Wand className="h-4 w-4" />
            Uruchom Smart Fix
          </>
        )}
      </button>
    </div>
  );
}

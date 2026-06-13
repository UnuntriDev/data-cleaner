import {
  AnimatePresence,
  m,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Copy, Pointer, Wand } from "./icons";

/**
 * Animated "before / after" hero showcase. A dirty table on the left is
 * resolved problem-by-problem: an auto-cursor moves to each issue, a tooltip
 * suggests a fix, then the matching clean value pops in on the right. Loops
 * every ~7s. Honors prefers-reduced-motion (renders the solved end state).
 */

type ProblemKind = "duplicate" | "missing" | "type";

interface Row {
  klient: string;
  kwota: string; // dirty display value
  clean: string; // cleaned value shown on the right
  problem?: ProblemKind;
}

// row order is fixed; problem steps reference rows by index
const ROWS: Row[] = [
  { klient: "Anna Kowalska", kwota: "1 200", clean: "1 200" },
  { klient: "Piotr Nowak", kwota: "980", clean: "980" },
  { klient: "Maria Wiśniewska", kwota: "—", clean: "1 480", problem: "missing" },
  { klient: "Ewa Zając", kwota: "1 750", clean: "1 750", problem: "duplicate" },
  { klient: "Magda Dąbrowska", kwota: "abc", clean: "2 300", problem: "type" },
];

interface Step {
  row: number; // index into ROWS (left table)
  tooltip: string;
}

// order the cursor visits the problems
const STEPS: Step[] = [
  { row: 3, tooltip: "Usuń duplikat" },
  { row: 2, tooltip: "Uzupełnij medianą" },
  { row: 4, tooltip: "Popraw na liczbę" },
];

// rows shown on the right after cleaning (duplicate removed)
const CLEAN_ROWS = ROWS.filter((r) => r.problem !== "duplicate");

type Phase = "move" | "suggest" | "fix";

export function HeroShowcase() {
  const reduce = useReducedMotion();
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("move");
  const [fixed, setFixed] = useState<Set<number>>(() => new Set());

  const leftRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });

  const activeRow = STEPS[stepIdx]?.row;

  // position the auto-cursor over the current problem row's status cell
  useLayoutEffect(() => {
    if (reduce) return;
    const wrap = leftRef.current;
    const cell = cellRefs.current[activeRow];
    if (!wrap || !cell) return;
    const w = wrap.getBoundingClientRect();
    const c = cell.getBoundingClientRect();
    setCursor({
      x: c.left - w.left + c.width / 2,
      y: c.top - w.top + c.height / 2,
    });
  }, [activeRow, reduce]);

  // loop state machine
  useEffect(() => {
    if (reduce) {
      setFixed(new Set(STEPS.map((s) => s.row)));
      return;
    }
    let t: ReturnType<typeof setTimeout>;
    if (phase === "move") {
      t = setTimeout(() => setPhase("suggest"), 850);
    } else if (phase === "suggest") {
      t = setTimeout(() => {
        setFixed((prev) => new Set(prev).add(STEPS[stepIdx].row));
        setPhase("fix");
      }, 1000);
    } else {
      // phase === "fix"
      const last = stepIdx >= STEPS.length - 1;
      t = setTimeout(
        () => {
          if (last) {
            setFixed(new Set());
            setStepIdx(0);
          } else {
            setStepIdx((i) => i + 1);
          }
          setPhase("move");
        },
        last ? 1700 : 1000,
      );
    }
    return () => clearTimeout(t);
  }, [phase, stepIdx, reduce]);

  const showTooltip = !reduce && (phase === "suggest" || phase === "fix");

  return (
    <m.div
      initial={reduce ? false : { opacity: 0, y: 20, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 22 }}
      className="glass-strong relative overflow-hidden rounded-3xl shadow-lift ring-1 ring-white/60"
    >
      {/* window chrome */}
      <div className="flex items-center gap-3 border-b border-sand-300/60 px-5 py-3.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-coral-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-sand-300" />
        </span>
        <span className="text-sm font-medium text-ink-500">klienci-demo.csv</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-2.5 py-1 text-xs font-semibold text-coral-700 ring-1 ring-coral-100">
          <Wand className="h-3.5 w-3.5" />
          Smart Fix
        </span>
      </div>

      <div className="grid gap-px bg-sand-300/40 sm:grid-cols-2">
        {/* BEFORE */}
        <div ref={leftRef} className="relative bg-cream-50/40 p-4">
          <PanelLabel tone="bad">Przed</PanelLabel>
          <div className="mt-3 space-y-1.5">
            {ROWS.map((row, i) => {
              const isFixed = fixed.has(i);
              const removed = row.problem === "duplicate" && isFixed;
              return (
                <div
                  key={row.klient}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                >
                  <span
                    className={[
                      "min-w-0 flex-1 truncate",
                      removed
                        ? "text-ink-400 line-through"
                        : "text-ink-700",
                    ].join(" ")}
                  >
                    {row.klient}
                  </span>
                  <span
                    className={[
                      "w-14 text-right tabular-nums",
                      row.problem && !isFixed
                        ? "font-semibold text-rose-500"
                        : removed
                          ? "text-ink-400 line-through"
                          : "text-ink-600",
                    ].join(" ")}
                  >
                    {row.kwota}
                  </span>
                  {/* status cell (cursor target) */}
                  <div
                    ref={(el) => {
                      cellRefs.current[i] = el;
                    }}
                    className="flex w-6 justify-center"
                  >
                    {row.problem ? (
                      isFixed ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                      )
                    ) : (
                      <Check className="h-4 w-4 text-ink-400/50" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* auto-cursor + tooltip */}
          {!reduce && (
            <m.div
              className="pointer-events-none absolute left-0 top-0 z-20"
              animate={{ x: cursor.x, y: cursor.y }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <Pointer className="h-5 w-5 -translate-x-1 -translate-y-1 text-coral-600 drop-shadow" />
              <AnimatePresence>
                {showTooltip && (
                  <m.div
                    key={stepIdx}
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-4 top-4 w-max max-w-[10rem] rounded-xl bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lift"
                  >
                    <span className="flex items-center gap-1.5">
                      <Wand className="h-3 w-3 text-coral-300" />
                      {STEPS[stepIdx].tooltip}
                    </span>
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          )}
        </div>

        {/* AFTER */}
        <div className="relative bg-emerald-50/30 p-4">
          <PanelLabel tone="good">Po</PanelLabel>
          <div className="mt-3 space-y-1.5">
            {CLEAN_ROWS.map((row) => {
              const origIdx = ROWS.indexOf(row);
              const isProblem = !!row.problem;
              const revealed = !isProblem || fixed.has(origIdx) || reduce;
              return (
                <div
                  key={row.klient}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate text-ink-700">
                    {row.klient}
                  </span>
                  <span className="w-14 text-right tabular-nums">
                    <AnimatePresence mode="wait" initial={false}>
                      <m.span
                        key={revealed ? "clean" : "wait"}
                        initial={
                          reduce ? false : { opacity: 0, scale: 0.7, y: -2 }
                        }
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 320, damping: 20 }}
                        className={
                          revealed && isProblem
                            ? "font-semibold text-emerald-600"
                            : revealed
                              ? "text-ink-600"
                              : "text-ink-400"
                        }
                      >
                        {revealed ? row.clean : "···"}
                      </m.span>
                    </AnimatePresence>
                  </span>
                  <div className="flex w-6 justify-center">
                    <m.span
                      initial={reduce ? false : { scale: 0 }}
                      animate={{ scale: revealed ? 1 : 0 }}
                      transition={{ type: "spring", stiffness: 360, damping: 18 }}
                    >
                      <Check className="h-4 w-4 text-emerald-500" />
                    </m.span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* footer summary */}
      <div className="flex items-center gap-2 border-t border-sand-300/60 px-5 py-3 text-xs text-ink-500">
        <Copy className="h-3.5 w-3.5 text-coral-500" />
        <span>1 duplikat, 1 brak, 1 błędny typ</span>
        <span className="ml-auto inline-flex items-center gap-1 font-semibold text-emerald-600">
          <Check className="h-3.5 w-3.5" />
          Gotowe do eksportu
        </span>
      </div>
    </m.div>
  );
}

function PanelLabel({
  tone,
  children,
}: {
  tone: "bad" | "good";
  children: React.ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em]",
        tone === "bad"
          ? "bg-rose-50 text-rose-500 ring-1 ring-rose-100"
          : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          tone === "bad" ? "bg-rose-500" : "bg-emerald-500",
        ].join(" ")}
      />
      {children}
    </span>
  );
}

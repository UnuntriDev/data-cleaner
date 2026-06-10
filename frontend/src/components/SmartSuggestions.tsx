import { AnimatePresence, m } from "framer-motion";
import type { Insight, IssueSeverity } from "../types";
import { PrimaryButton } from "./PrimaryButton";
import { Alert, Check, Sparkles, Spinner, Wand } from "./icons";

interface SmartSuggestionsProps {
  insights: Insight[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  onToggleAll: () => void;
  onFix: () => void;
  running: boolean;
  locked?: boolean;
}

const SEVERITY: Record<
  IssueSeverity,
  { label: string; badge: string; bar: string }
> = {
  high: {
    label: "Wysoki",
    badge: "bg-red-100 text-red-700",
    bar: "from-red-400 to-red-600",
  },
  medium: {
    label: "Średni",
    badge: "bg-amber-100 text-amber-700",
    bar: "from-amber-400 to-amber-600",
  },
  low: {
    label: "Niski",
    badge: "bg-coral-100 text-coral-700",
    bar: "from-coral-400 to-coral-600",
  },
};

const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
};

export function SmartSuggestions({
  insights,
  selected,
  onToggle,
  onToggleAll,
  onFix,
  running,
  locked = false,
}: SmartSuggestionsProps) {
  if (insights.length === 0) {
    return <CleanState />;
  }

  const allSelected = selected.size === insights.length;
  const selectedCount = selected.size;
  const controlsDisabled = running || locked;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-100 text-coral-600">
            <Wand className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-900">
              Wykryto {insights.length}{" "}
              {plural(insights.length, "problem", "problemy", "problemów")}
            </p>
            <p className="text-xs text-ink-500">
              Zaznacz poprawki i napraw je jednym kliknięciem
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleAll}
          disabled={controlsDisabled}
          className={[
            "shrink-0 rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-ink-600 ring-1 ring-sand-300 transition-colors",
            controlsDisabled
              ? "cursor-not-allowed opacity-60"
              : "hover:text-coral-700 hover:ring-coral-300",
          ].join(" ")}
        >
          {allSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
        </button>
      </div>

      <m.div
        variants={list}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {insights.map((ins) => (
          <m.div key={ins.code + (ins.column ?? "")} variants={item}>
            <IssueCard
              insight={ins}
              selected={selected.has(issueKey(ins))}
              onToggle={() => onToggle(issueKey(ins))}
              disabled={controlsDisabled}
            />
          </m.div>
        ))}
      </m.div>

      <div className="pt-1">
        <PrimaryButton
          onClick={onFix}
          loading={running}
          disabled={selectedCount === 0 || locked}
          count={selectedCount || undefined}
          fullWidth
          icon={<Sparkles className="h-4 w-4" />}
        >
          {running
            ? "Naprawiam…"
            : locked
              ? "Plik już naprawiony"
              : selectedCount === 0
              ? "Wybierz poprawki"
              : "Napraw zaznaczone"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function issueKey(ins: Insight): string {
  return ins.column ? `${ins.code}:${ins.column}` : ins.code;
}

export function SmartSuggestionsLoading() {
  return (
    <div className="glass-strong flex items-center gap-4 rounded-2xl p-5 shadow-soft ring-1 ring-coral-100/80">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
        <Spinner className="h-5 w-5 animate-spin" />
      </span>
      <div>
        <p className="font-semibold text-ink-900">Analizuję jakość danych</p>
        <p className="text-sm text-ink-500">
          Szukam duplikatów, braków, niespójnych typów i problemów w tekście.
        </p>
      </div>
    </div>
  );
}

export function SmartSuggestionsError({ message }: { message: string }) {
  return (
    <div className="glass-strong flex items-start gap-4 rounded-2xl p-5 shadow-soft ring-1 ring-amber-200/80">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <Alert className="h-6 w-6" />
      </span>
      <div>
        <p className="font-semibold text-ink-900">
          Nie udało się automatycznie wykryć problemów
        </p>
        <p className="mt-1 break-words text-sm leading-relaxed text-ink-500">
          {message}
        </p>
      </div>
    </div>
  );
}

function IssueCard({
  insight,
  selected,
  onToggle,
  disabled = false,
}: {
  insight: Insight;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  const sev = SEVERITY[insight.severity];
  return (
    <m.button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={[
        "group relative w-full overflow-hidden rounded-2xl p-4 pl-5 text-left",
        "transition-colors duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100",
        disabled && "cursor-not-allowed opacity-65",
        selected
          ? "bg-gradient-to-br from-coral-50 to-white ring-2 ring-coral-400 shadow-lift"
          : "glass-strong ring-1 ring-sand-300 shadow-soft hover:ring-coral-300",
      ].join(" ")}
    >
      <m.span
        aria-hidden
        initial={false}
        animate={{ opacity: selected ? 1 : 0, scaleY: selected ? 1 : 0.4 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b ${sev.bar}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={[
                "font-semibold tracking-tight transition-colors",
                selected ? "text-coral-700" : "text-ink-900",
              ].join(" ")}
            >
              {insight.title}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${sev.badge}`}
            >
              {sev.label}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {insight.detail}
          </p>
        </div>

        <span
          className={[
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            selected
              ? "border-coral-500 bg-coral-500 text-white"
              : "border-sand-300 bg-white/70 text-transparent group-hover:border-coral-300",
          ].join(" ")}
        >
          <AnimatePresence>
            {selected && (
              <m.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 18 }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </m.span>
            )}
          </AnimatePresence>
        </span>
      </div>
    </m.button>
  );
}

function CleanState() {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong flex items-center gap-4 rounded-2xl p-5 shadow-soft ring-1 ring-emerald-200/70"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
        <Check className="h-6 w-6" strokeWidth={3} />
      </span>
      <div>
        <p className="font-semibold text-ink-900">Dane wyglądają czysto</p>
        <p className="text-sm text-ink-500">
          Nie wykryliśmy typowych problemów. Możesz też ręcznie wybrać operacje
          poniżej.
        </p>
      </div>
    </m.div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

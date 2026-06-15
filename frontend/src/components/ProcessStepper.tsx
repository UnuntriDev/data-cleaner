import { useMemo } from "react";
import {
  BarChart3,
  Check,
  Download,
  FileUp,
  GitCompareArrows,
  SearchCheck,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

type StepState = "completed" | "active" | "pending";

export const PROCESS_STEPS: ProcessStep[] = [
  { id: 1, title: "Wgraj plik", description: "CSV, XLSX lub JSON do 50 MB.", icon: FileUp },
  { id: 2, title: "Analiza jakości", description: "Podgląd danych i statystyki jakości.", icon: BarChart3 },
  { id: 3, title: "Wykrywanie problemów", description: "Duplikaty, braki, błędne wartości.", icon: SearchCheck },
  { id: 4, title: "Smart Fix lub ręcznie", description: "Zaakceptuj sugestie albo wybierz operacje.", icon: WandSparkles },
  { id: 5, title: "Podgląd zmian", description: "Porównaj wynik przed eksportem.", icon: GitCompareArrows },
  { id: 6, title: "Eksport", description: "Pobierz czysty plik CSV, XLSX lub JSON.", icon: Download },
];

function stepState(stepId: number, currentStep: number): StepState {
  if (stepId < currentStep) return "completed";
  if (stepId === currentStep) return "active";
  return "pending";
}

function circleClass(state: StepState): string {
  const base =
    "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300";
  if (state === "completed") return `${base} border-coral-400 bg-white text-coral-700 shadow-soft`;
  if (state === "active") return `${base} scale-110 border-coral-600 bg-coral-600 text-white shadow-glow`;
  return `${base} border-slate-200 bg-white/70 text-slate-400`;
}

function textClass(state: StepState): string {
  return state === "pending" ? "text-slate-400" : "text-ink-900";
}

interface ProcessStepperProps {
  currentStep: number;
}

export function ProcessStepper({ currentStep }: ProcessStepperProps) {
  const progress = useMemo(
    () => ((currentStep - 1) / (PROCESS_STEPS.length - 1)) * 100,
    [currentStep],
  );
  const progressWidth = progress * 0.86;

  return (
    <div className="mx-auto mt-14 max-w-6xl">
      <div className="relative">
        <div
          aria-hidden
          className="absolute left-[7%] right-[7%] top-7 hidden h-0.5 rounded-full bg-slate-200 md:block"
        />
        <div
          aria-hidden
          className="absolute left-[7%] top-7 hidden h-0.5 rounded-full bg-coral-600 transition-all duration-500 ease-out md:block"
          style={{ width: `${progressWidth}%` }}
        />

        <ol className="grid gap-6 md:grid-cols-6 md:gap-4">
          {PROCESS_STEPS.map((step) => {
            const state = stepState(step.id, currentStep);
            const Icon = state === "completed" ? Check : step.icon;

            return (
              <li
                key={step.id}
                className="relative flex items-start gap-4 md:flex-col md:items-center md:text-center"
              >
                <span className={circleClass(state)}>
                  {state === "active" && (
                    <span className="absolute inset-0 rounded-full bg-coral-500/30 blur-md" />
                  )}
                  <Icon className="relative h-6 w-6" />
                </span>

                <div className="min-w-0 pt-1 md:pt-4">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral-500">
                    Krok {step.id}
                  </p>
                  <h3
                    className={[
                      "mt-1 font-display text-base font-bold transition-colors duration-300",
                      textClass(state),
                    ].join(" ")}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={[
                      "mt-1 text-sm leading-relaxed transition-colors duration-300",
                      state === "pending" ? "text-slate-400" : "text-ink-500",
                    ].join(" ")}
                  >
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

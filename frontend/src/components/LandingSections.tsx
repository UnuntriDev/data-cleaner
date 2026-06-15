import { m } from "framer-motion";
import { Play } from "lucide-react";
import { useState, type ReactNode } from "react";
import { BentoSmartFix } from "./BentoSmartFix";
import { PrimaryButton } from "./PrimaryButton";
import { PROCESS_STEPS, ProcessStepper } from "./ProcessStepper";
import { FileIcon, UploadCloud } from "./icons";

const ease = [0.22, 1, 0.36, 1] as const;

interface LandingWorkflowProps {
  onUpload: () => void;
  onDemo?: () => void;
}

export function LandingWorkflow({ onUpload, onDemo }: LandingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);

  function advanceStep() {
    setCurrentStep((s) => (s >= PROCESS_STEPS.length ? 1 : s + 1));
  }

  return (
    <section id="workflow" className="scroll-mt-8">
      <div className="mx-auto max-w-3xl text-center">
        <div className="inline-flex items-center gap-4">
          <h2 className="font-serif text-4xl leading-[1.02] text-balance text-ink-900 sm:text-5xl lg:text-[3.25rem]">
            Jak to <span className="text-gradient italic">działa</span>
          </h2>
          <button
            type="button"
            onClick={advanceStep}
            aria-label="Następny krok"
            className="sheen inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral-600 text-white shadow-glow transition-colors hover:bg-coral-700"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
        </div>
        <p className="mt-3 font-display text-base font-semibold text-ink-700 sm:text-lg">
          Od surowego pliku do czystych danych
        </p>
        <p className="mt-2 text-base leading-relaxed text-ink-500">
          Sześć kroków, jeden nieprzerwany proces.
        </p>
      </div>

      <ProcessStepper currentStep={currentStep} />

      <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(20rem,1fr)] lg:items-stretch">
        <BentoTile className="min-h-[21rem]">
          <BentoSmartFix />
        </BentoTile>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease, delay: 0.08 }}
          className="flex flex-col items-center justify-center px-1 py-4 text-center sm:px-3 lg:py-0"
        >
          <p className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Gotowy do wyczyszczenia danych?
          </p>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink-500">
            Wgraj własny plik albo uruchom przykładowy zestaw danych.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <PrimaryButton
              onClick={onUpload}
              icon={<UploadCloud className="h-4 w-4" />}
            >
              Wgraj plik
            </PrimaryButton>
            {onDemo && (
              <PrimaryButton
                variant="ghost"
                onClick={onDemo}
                icon={<FileIcon className="h-4 w-4" />}
              >
                Wczytaj przykład
              </PrimaryButton>
            )}
          </div>
        </m.div>
      </div>
    </section>
  );
}

function BentoTile({
  className = "",
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease, delay }}
      whileHover={{ y: -4 }}
      className={[
        "group glass relative overflow-hidden rounded-3xl p-6 ring-1 ring-white/60",
        "transition-shadow duration-300 hover:shadow-lift",
        className,
      ].join(" ")}
    >
      {/* border-glow on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 0 1.5px var(--color-coral-300)" }}
      />
      <div className="relative h-full">{children}</div>
    </m.div>
  );
}

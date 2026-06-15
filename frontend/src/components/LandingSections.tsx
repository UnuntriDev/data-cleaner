import { useState } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { PROCESS_STEPS, ProcessStepper } from "./ProcessStepper";
import { FileIcon, UploadCloud } from "./icons";

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
            className="sheen inline-flex items-center gap-2 shrink-0 rounded-full bg-coral-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-colors hover:bg-coral-700"
          >
            <span>Krok {currentStep}/{PROCESS_STEPS.length}</span>
            <span className="text-lg leading-none">›</span>
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

      <div className="relative mt-16">
        <div className="aurora" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Gotowy do wyczyszczenia danych?
          </p>
          <p className="mt-3 text-base leading-relaxed text-ink-500">
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
        </div>
      </div>
    </section>
  );
}

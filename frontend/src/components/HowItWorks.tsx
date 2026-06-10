import { m } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import { PrimaryButton } from "./PrimaryButton";
import { Download, FileIcon, Sparkles, UploadCloud } from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Step {
  icon: Icon;
  title: string;
  text: string;
}

interface HowItWorksProps {
  onUpload: () => void;
  onDemo?: () => void;
}

const STEPS: Step[] = [
  {
    icon: UploadCloud,
    title: "Wgraj plik",
    text: "Wgraj plik CSV, Excel lub JSON. Aplikacja przechowuje go tymczasowo, przygotowuje podgląd i wykonuje podstawowe kontrole jakości.",
  },
  {
    icon: Sparkles,
    title: "Sprawdź wykryte problemy",
    text: "Zobacz duplikaty, braki i nieprawidłowe pola. Wybierz automatyczne poprawki albo ustaw własne operacje czyszczenia.",
  },
  {
    icon: Download,
    title: "Pobierz czyste dane",
    text: "Pobierz wyczyszczony zestaw danych jako CSV, Excel lub JSON.",
  },
];

/** "Jak to działa" section: three numbered steps revealed on scroll. */
export function HowItWorks({ onUpload, onDemo }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="scroll-mt-8">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          Jak to działa
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 sm:text-base">
          Trzy kroki od problematycznego pliku do danych gotowych do eksportu.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <m.div
            key={step.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            className="glass relative overflow-hidden rounded-3xl p-6 ring-1 ring-white/50"
          >
            <span className="pointer-events-none absolute right-5 top-4 font-display text-4xl font-bold text-coral-100">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-700 text-white shadow-glow">
              <step.icon className="h-6 w-6" />
            </span>
            <h3 className="relative mt-4 font-display text-lg font-bold text-ink-900">
              {step.title}
            </h3>
            <p className="relative mt-1.5 text-sm leading-relaxed text-ink-500">
              {step.text}
            </p>
          </m.div>
        ))}
      </div>

      <m.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-10 flex max-w-xl flex-col items-center text-center"
      >
        <p className="font-display text-xl font-bold tracking-tight text-ink-900">
          Gotowy do wyczyszczenia danych?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Wgraj własny plik albo uruchom przykładowy zestaw danych.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
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
    </section>
  );
}

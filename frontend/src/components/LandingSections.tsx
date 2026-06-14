import { m } from "framer-motion";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { BentoSmartFix } from "./BentoSmartFix";
import { PrimaryButton } from "./PrimaryButton";
import {
  Alert,
  Database,
  Download,
  FileIcon,
  Rows,
  Search,
  UploadCloud,
  Wand,
} from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface WorkflowStep {
  icon: Icon;
  title: string;
  text: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

const DETECT_CHIPS = ["Duplikaty", "Braki", "Niespójne nazwy", "Błędne typy"];

const WORKFLOW: WorkflowStep[] = [
  {
    icon: UploadCloud,
    title: "Wgraj plik",
    text: "CSV, XLSX lub JSON do 50 MB.",
  },
  {
    icon: Search,
    title: "Analiza jakości",
    text: "Podgląd danych i statystyki jakości.",
  },
  {
    icon: Alert,
    title: "Wykrywanie problemów",
    text: "Duplikaty, braki, błędne wartości.",
  },
  {
    icon: Wand,
    title: "Smart Fix lub ręcznie",
    text: "Zaakceptuj sugestie albo wybierz operacje.",
  },
  {
    icon: Rows,
    title: "Podgląd zmian",
    text: "Porównaj wynik przed eksportem.",
  },
  {
    icon: Download,
    title: "Eksport",
    text: "Pobierz czysty plik CSV, XLSX lub JSON.",
  },
];

interface LandingWorkflowProps {
  onUpload: () => void;
  onDemo?: () => void;
}

/** Horizontal timeline of the full cleaning workflow, with the closing CTA. */
export function LandingWorkflow({ onUpload, onDemo }: LandingWorkflowProps) {
  return (
    <section id="workflow" className="scroll-mt-8">
      <SectionHeading
        eyebrow="Jak to działa"
        title="Od surowego pliku do czystych danych"
        text="Sześć kroków, jeden nieprzerwany proces."
      />

      <ol className="relative mt-14 grid gap-y-12 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-6 lg:gap-x-0">
        {/* connecting rail (desktop) */}
        <m.div
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease }}
          className="absolute left-[8.33%] right-[8.33%] top-7 hidden h-px origin-left bg-gradient-to-r from-coral-100 via-coral-300 to-coral-100 lg:block"
        />
        {/* connecting rail (mobile) */}
        <div
          aria-hidden
          className="absolute bottom-7 left-7 top-7 w-px bg-gradient-to-b from-coral-100 via-coral-300 to-coral-100 sm:hidden"
        />

        {WORKFLOW.map((step, i) => (
          <m.li
            key={step.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease, delay: i * 0.09 }}
            className="relative flex items-start gap-4 pl-0 sm:flex-col sm:items-center sm:gap-0 sm:text-center lg:px-3"
          >
            <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-coral-600 shadow-soft ring-1 ring-coral-300/60">
              <step.icon className="h-6 w-6" />
            </span>
            <div className="min-w-0 pt-1 sm:pt-4">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-coral-500">
                Krok {i + 1}
              </p>
              <h3 className="mt-1 font-display text-base font-bold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">
                {step.text}
              </p>
            </div>
          </m.li>
        ))}
      </ol>

      <m.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.42, ease }}
        className="mx-auto mt-16 flex max-w-xl flex-col items-center text-center"
      >
        <p className="font-display text-2xl font-bold tracking-tight text-ink-900">
          Gotowy do wyczyszczenia danych?
        </p>
        <p className="mt-2 text-base leading-relaxed text-ink-500">
          Wgraj własny plik albo uruchom przykładowy zestaw danych.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
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

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-8">
      <SectionHeading
        eyebrow="Funkcje"
        title="Najważniejsze narzędzia w jednym workflow"
      />

      <div className="relative mt-12">
        <div className="aurora" />
        <div className="relative z-10 grid gap-4 sm:grid-cols-2 lg:auto-rows-[11rem] lg:grid-cols-4">
          {/* interactive 2x2 */}
          <BentoTile className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
            <BentoSmartFix />
          </BentoTile>

          {/* wide detection tile */}
          <BentoTile className="sm:col-span-2 lg:col-span-2" delay={0.06}>
            <div className="flex h-full flex-col">
              <TileHead
                icon={Search}
                title="Auto-wykrywanie problemów"
                text="Duplikaty, braki, niespójne nazwy kolumn i błędne typy — wykryte zanim klikniesz cokolwiek."
              />
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {DETECT_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-coral-50 px-2.5 py-1 text-xs font-medium text-coral-700 ring-1 ring-coral-100"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </BentoTile>

          <BentoTile delay={0.12}>
            <TileHead
              icon={Database}
              title="Podgląd przed i po"
              text="Porównaj wynik i podsumowanie zmian przed eksportem."
            />
            <div className="mt-4 overflow-hidden rounded-xl bg-white/55 text-xs ring-1 ring-sand-300/40">
              <div className="flex items-center gap-2 border-b border-sand-300/40 bg-rose-50/70 px-3 py-1.5 font-mono text-rose-600">
                <span className="font-bold select-none">−</span>
                <span>kwota: <span className="font-semibold">abc</span></span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50/70 px-3 py-1.5 font-mono text-emerald-700">
                <span className="font-bold select-none">+</span>
                <span>kwota: <span className="font-semibold">1 200</span></span>
              </div>
            </div>
          </BentoTile>

          <BentoTile delay={0.18}>
            <TileHead
              icon={Download}
              title="Eksport CSV/XLSX/JSON"
              text="Pobierz czysty plik w wybranym formacie."
            />
            <div className="mt-4 flex gap-2">
              {["CSV", "XLSX", "JSON"].map((fmt) => (
                <span
                  key={fmt}
                  className="rounded-lg bg-coral-50 px-2.5 py-1 text-xs font-semibold text-coral-700 ring-1 ring-coral-100"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </BentoTile>
        </div>
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

function TileHead({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  text: string;
}) {
  return (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coral-100 text-coral-700 transition-transform duration-300 group-hover:scale-105">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink-900">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{text}</p>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="inline-flex items-center rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-coral-700 shadow-soft ring-1 ring-coral-300/50">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl tracking-tight text-ink-900 sm:text-4xl">
        {title}
      </h2>
      {text && (
        <p className="mt-3 text-base leading-relaxed text-ink-500">
          {text}
        </p>
      )}
    </div>
  );
}

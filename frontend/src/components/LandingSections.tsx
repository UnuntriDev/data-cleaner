import { m } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import {
  Alert,
  Database,
  Download,
  Rows,
  Search,
  UploadCloud,
  Wand,
} from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Feature {
  icon: Icon;
  title: string;
  text: string;
}

interface WorkflowStep {
  icon: Icon;
  title: string;
  text: string;
}

const ease = [0.22, 1, 0.36, 1] as const;

const FEATURES: Feature[] = [
  {
    icon: Search,
    title: "Auto-wykrywanie problemów",
    text: "Aplikacja rozpoznaje duplikaty, braki, niespójne nazwy kolumn i wartości wymagające sprawdzenia.",
  },
  {
    icon: Wand,
    title: "Smart Fix jednym kliknięciem",
    text: "Możesz zaakceptować sugerowane poprawki albo samodzielnie wybrać operacje czyszczenia.",
  },
  {
    icon: Database,
    title: "Podgląd przed i po",
    text: "Zobacz dane wejściowe, wynik czyszczenia oraz krótkie podsumowanie zmian przed eksportem.",
  },
  {
    icon: Download,
    title: "Eksport CSV/XLSX/JSON",
    text: "Po zakończeniu czyszczenia pobierzesz wynik w formacie dopasowanym do dalszej pracy.",
  },
];

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

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-8">
      <SectionHeading
        eyebrow="Funkcje"
        title="Najważniejsze narzędzia w jednym workflow"
      />

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {FEATURES.map((feature, i) => (
          <m.article
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease, delay: i * 0.06 }}
            className="glass rounded-3xl p-5 ring-1 ring-white/50"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-coral-500 to-coral-700 text-white shadow-glow">
              <feature.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-display text-lg font-bold text-ink-900">
              {feature.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
              {feature.text}
            </p>
          </m.article>
        ))}
      </div>
    </section>
  );
}

/** Horizontal timeline of the full cleaning workflow. */
export function LandingWorkflow() {
  return (
    <section id="workflow" className="scroll-mt-8">
      <SectionHeading
        eyebrow="Workflow"
        title="Od surowego pliku do czystych danych"
        text="Sześć kroków, jeden nieprzerwany proces."
      />

      <ol className="relative mt-12 grid gap-y-10 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-6 lg:gap-x-0">
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
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-coral-500 to-coral-700 font-display text-[0.65rem] font-bold text-white">
                {i + 1}
              </span>
            </span>
            <div className="min-w-0 pt-1 sm:pt-4">
              <h3 className="font-display text-sm font-bold text-ink-900">
                {step.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                {step.text}
              </p>
            </div>
          </m.li>
        ))}
      </ol>
    </section>
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
      <p className="inline-flex items-center rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-coral-700 shadow-soft ring-1 ring-coral-200/70">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
        {title}
      </h2>
      {text && (
        <p className="mt-2 text-sm leading-relaxed text-ink-500 sm:text-base">
          {text}
        </p>
      )}
    </div>
  );
}

import { m } from "framer-motion";
import type { ComponentType, SVGProps } from "react";
import {
  Bolt,
  Check,
  Columns,
  Database,
  Download,
  Search,
  Shield,
  Wand,
} from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface Feature {
  icon: Icon;
  title: string;
  text: string;
}

interface DocItem {
  title: string;
  items: string[];
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

const DOCS: DocItem[] = [
  {
    title: "Obsługiwane pliki",
    items: [
      "CSV, Excel oraz JSON.",
      "Maksymalny rozmiar pliku: 50 MB.",
      "Podgląd pokazuje próbkę danych i podstawowe statystyki jakości.",
    ],
  },
  {
    title: "Czyszczenie danych",
    items: [
      "Sugestie Smart Fix bazują na wykrytych problemach w pliku.",
      "Tryb ręczny pozwala wybrać konkretne operacje.",
      "Ten sam plik można naprawić raz w ramach bieżącego workflow.",
    ],
  },
  {
    title: "Eksport i przechowywanie",
    items: [
      "Eksport jest dostępny dopiero po udanym czyszczeniu.",
      "Pliki są obsługiwane tymczasowo po stronie serwera.",
      "Wynik można pobrać jako CSV, XLSX albo JSON.",
    ],
  },
];

const DOC_ICONS = [Columns, Shield, Bolt] as const;

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

export function LandingDocs() {
  return (
    <section id="docs" className="scroll-mt-8">
      <SectionHeading
        eyebrow="Dokumentacja"
        title="Podstawy działania aplikacji"
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {DOCS.map((group, i) => {
          const Icon = DOC_ICONS[i] ?? Check;
          return (
            <m.article
              key={group.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, ease, delay: i * 0.07 }}
              className="glass-strong rounded-3xl p-6 ring-1 ring-white/60"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coral-100 text-coral-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-lg font-bold text-ink-900">
                  {group.title}
                </h3>
              </div>

              <ul className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-ink-500">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral-600" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </m.article>
          );
        })}
      </div>
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

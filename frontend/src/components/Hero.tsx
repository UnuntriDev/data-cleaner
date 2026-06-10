import { m } from "framer-motion";
import { PrimaryButton } from "./PrimaryButton";
import { ArrowRight, FileIcon, UploadCloud } from "./icons";

interface HeroProps {
  /** Opens the file picker. */
  onUpload: () => void;
  /** Smooth-scrolls to the "Jak to działa" section. */
  onHowItWorks: () => void;
  /** Loads the built-in sample file through the normal upload flow. */
  onDemo: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;
const rise = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease, delay },
});

/**
 * Landing hero: headline, supporting copy and the primary calls to action.
 * Presentational — all behaviour is passed in.
 */
export function Hero({ onUpload, onHowItWorks, onDemo }: HeroProps) {
  return (
    <div className="max-w-xl">
      <m.h1
        {...rise(0)}
        className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance text-ink-900 sm:text-5xl"
      >
        Wyczyść CSV, Excel i JSON przed{" "}
        <span className="text-gradient">eksportem</span>
      </m.h1>

      <m.p
        {...rise(0.1)}
        className="mt-4 text-base leading-relaxed text-ink-500 sm:text-lg"
      >
        Wgraj CSV, Excel lub JSON, wykryj duplikaty, braki i nieprawidłowe
        pola, a potem pobierz wyczyszczony zestaw danych.
      </m.p>

      <m.div {...rise(0.15)} className="mt-7 flex flex-wrap gap-3">
        <PrimaryButton
          onClick={onUpload}
          icon={<UploadCloud className="h-4 w-4" />}
        >
          Wgraj plik
        </PrimaryButton>
        <PrimaryButton
          variant="ghost"
          onClick={onHowItWorks}
          icon={<ArrowRight className="h-4 w-4" />}
        >
          Jak to działa
        </PrimaryButton>
        <PrimaryButton
          variant="ghost"
          onClick={onDemo}
          icon={<FileIcon className="h-4 w-4" />}
        >
          Wczytaj przykład
        </PrimaryButton>
      </m.div>
    </div>
  );
}

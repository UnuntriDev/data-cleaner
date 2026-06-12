import { m } from "framer-motion";

interface LandingFooterProps {
  onOpenApp: () => void;
}

const LINKS = [
  { label: "Funkcje", href: "#features" },
  { label: "Dokumentacja", href: "#docs" },
];

export function LandingFooter({ onOpenApp }: LandingFooterProps) {
  return (
    <m.footer
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-16 border-t border-sand-300/60 pb-28 pt-8"
    >
      <div className="flex flex-col gap-6 text-sm text-ink-500 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <p className="font-display text-lg font-bold tracking-tight text-ink-900">
            Data Cleaner
          </p>
          <p className="mt-2 leading-relaxed">
            Prosty workflow do wykrywania problemów, czyszczenia i eksportu
            danych z plików CSV, Excel i JSON.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-4 sm:justify-end">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-medium transition-colors hover:text-coral-600"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={onOpenApp}
            className="font-semibold text-coral-600 transition-colors hover:text-coral-700"
          >
            Otwórz aplikację
          </button>
        </nav>
      </div>

      <p className="mt-8 text-xs text-ink-400">
        © {new Date().getFullYear()} Data Cleaner. Pliki są obsługiwane w
        ramach bieżącego workflow aplikacji.
      </p>
    </m.footer>
  );
}

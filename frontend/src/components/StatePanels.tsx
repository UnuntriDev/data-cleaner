import { m } from "framer-motion";
import { Alert, XCircle } from "./icons";

/** Shown when a cleaning run produces zero rows. */
export function EmptyResultPanel() {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong flex flex-col items-center gap-4 rounded-3xl p-10 text-center shadow-soft ring-1 ring-amber-200/80"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <Alert className="h-7 w-7" />
      </span>
      <div className="max-w-sm">
        <h3 className="font-display text-lg font-bold text-ink-900">
          Pusty wynik czyszczenia
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
          Wybrane operacje usunęły wszystkie wiersze. Spróbuj odznaczyć
          agresywne operacje, np. usuwanie pustych wierszy lub wartości
          odstających.
        </p>
      </div>
    </m.div>
  );
}

/** Shown when parsing or cleaning fails. */
export function ErrorPanel({ message }: { message: string }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong flex flex-col items-center gap-4 rounded-3xl p-10 text-center shadow-soft ring-1 ring-red-200/70"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <XCircle className="h-7 w-7" />
      </span>
      <div className="max-w-sm">
        <h3 className="font-display text-lg font-bold text-ink-900">
          Coś poszło nie tak
        </h3>
        <p className="mt-1.5 break-words text-sm leading-relaxed text-ink-500">
          {message}
        </p>
      </div>
    </m.div>
  );
}

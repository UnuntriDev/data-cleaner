import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { Check, FileIcon, UploadCloud } from "./icons";

interface FileUploadCardProps {
  onUpload: (file: File) => void;
  busy: boolean;
  fileName: string | null;
  /** External ref so parent CTAs can open the file picker. */
  inputRef?: RefObject<HTMLInputElement>;
}

const ACCEPT = ".csv,.xlsx,.xls,.json";

// drag-over micro-particles (left %, animation delay)
const PARTICLES = [
  { left: 12, delay: 0 },
  { left: 28, delay: 0.25 },
  { left: 46, delay: 0.5 },
  { left: 62, delay: 0.15 },
  { left: 78, delay: 0.4 },
  { left: 90, delay: 0.6 },
];

export function FileUploadCard({
  onUpload,
  busy,
  fileName,
  inputRef,
}: FileUploadCardProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const fileInput = inputRef ?? internalRef;
  const [dragging, setDragging] = useState(false);
  const reduce = useReducedMotion();

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onUpload(file);
  }

  function open() {
    if (!busy) fileInput.current?.click();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }

  const empty = !fileName;

  return (
    <m.div
      role="button"
      tabIndex={busy ? -1 : 0}
      aria-label="Upload a data file"
      onKeyDown={handleKeyDown}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={open}
      whileHover={busy ? undefined : { y: -2 }}
      animate={dragging ? { scale: 1.01 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 30, mass: 0.8 }}
      className={[
        "group relative flex cursor-pointer items-center justify-center overflow-hidden transform-gpu",
        "transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100",
        // compact docked card when loaded, tall premium drop target when empty
        fileName
          ? "min-h-0 rounded-2xl border-2 border-dashed border-sand-300 glass p-4 sm:p-4"
          : "min-h-[16rem] rounded-3xl p-8 sm:p-12",
        empty &&
          (dragging
            ? "bg-coral-50 shadow-glow"
            : "glass hover:shadow-lift"),
        busy && "pointer-events-none opacity-70",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* animated conic-gradient border (empty state) */}
      {empty && (
        <>
          <div
            aria-hidden
            className="animate-spin-slow pointer-events-none absolute -inset-1/2 z-0"
            style={{
              backgroundImage:
                "conic-gradient(from 0deg, var(--color-coral-500), var(--color-emerald-400), var(--color-coral-500))",
              opacity: dragging ? 0.55 : 0.32,
            }}
          />
          {/* inner mask leaves only a thin gradient ring at the edge */}
          <div className="glass pointer-events-none absolute inset-[2px] z-0 rounded-[calc(1.75rem-2px)]" />
          <div className="grid-dots pointer-events-none absolute inset-0 z-0 opacity-40" />
        </>
      )}

      {/* drag-over particles */}
      {empty && dragging && !reduce && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {PARTICLES.map((p, i) => (
            <m.span
              key={i}
              className="absolute bottom-8 h-1.5 w-1.5 rounded-full"
              style={{
                left: `${p.left}%`,
                backgroundColor:
                  i % 2
                    ? "var(--color-emerald-400)"
                    : "var(--color-coral-400)",
              }}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: -96, opacity: [0, 1, 0] }}
              transition={{
                duration: 1.4,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <AnimatePresence mode="wait" initial={false}>
        {fileName ? (
          <m.div
            key="loaded"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full items-center gap-4"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-600">
              <FileIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-ink-900">
                {fileName}
              </p>
              <p className="text-sm text-ink-500">
                Kliknij lub upuść, aby wgrać inny plik
              </p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-5 w-5" />
            </span>
          </m.div>
        ) : (
          <m.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="relative z-10 flex flex-col items-center gap-5 text-center"
          >
            <m.span
              animate={
                dragging ? { scale: 1.12, rotate: -4 } : { scale: 1, rotate: 0 }
              }
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-coral-500 to-coral-700 text-white shadow-glow"
            >
              <UploadCloud className="h-10 w-10" />
            </m.span>
            <div>
              <p className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
                {dragging ? "Upuść plik tutaj" : "Przeciągnij i upuść plik"}
              </p>
              <p className="mt-1.5 text-sm font-medium text-ink-500">
                albo kliknij, aby wybrać
              </p>
            </div>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-ink-400 ring-1 ring-sand-300/70">
              CSV, XLSX, JSON · maks. 50 MB
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

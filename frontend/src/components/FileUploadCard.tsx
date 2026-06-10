import { AnimatePresence, m } from "framer-motion";
import { useRef, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { Check, FileIcon, UploadCloud } from "./icons";

interface FileUploadCardProps {
  onUpload: (file: File) => void;
  busy: boolean;
  fileName: string | null;
  /**
   * Optional external ref to the hidden <input>. Lets parent CTAs (hero /
   * nav buttons) open the picker without duplicating the input.
   */
  inputRef?: RefObject<HTMLInputElement>;
}

const ACCEPT = ".csv,.xlsx,.xls,.json";

export function FileUploadCard({
  onUpload,
  busy,
  fileName,
  inputRef,
}: FileUploadCardProps) {
  const internalRef = useRef<HTMLInputElement>(null);
  const fileInput = inputRef ?? internalRef;
  const [dragging, setDragging] = useState(false);

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
        "relative flex cursor-pointer items-center justify-center overflow-hidden transform-gpu",
        "border-2 border-dashed transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100",
        // Compact once a file is loaded (the docked header card); a tall, easy
        // and visually dominant drop target while empty.
        fileName
          ? "min-h-0 rounded-2xl p-4 sm:p-4"
          : "min-h-[16rem] rounded-3xl p-8 sm:p-12",
        dragging
          ? "border-coral-500 bg-coral-50 shadow-glow"
          : "border-sand-300 glass hover:border-coral-400 hover:bg-white/80 hover:shadow-lift",
        busy && "pointer-events-none opacity-70",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!fileName && (
        <div className="pointer-events-none absolute inset-0 grid-dots opacity-40" />
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

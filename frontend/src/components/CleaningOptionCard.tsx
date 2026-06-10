import { AnimatePresence, m } from "framer-motion";
import type { Preset } from "../presets";
import { Check } from "./icons";

interface CleaningOptionCardProps {
  preset: Preset;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function CleaningOptionCard({
  preset,
  selected,
  onToggle,
  disabled = false,
}: CleaningOptionCardProps) {
  return (
    <m.button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={onToggle}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
      className={[
        "group relative w-full overflow-hidden rounded-2xl border p-5 pl-6 text-left",
        "transition-[background-color,border-color,box-shadow,transform] duration-200 outline-none",
        "focus-visible:ring-2 focus-visible:ring-coral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100",
        disabled && "cursor-not-allowed opacity-65",
        selected
          ? "border-coral-500 bg-coral-50/90 ring-2 ring-coral-200 shadow-lift"
          : "glass-strong border-white/70 ring-1 ring-sand-300/80 shadow-soft hover:border-coral-300 hover:bg-coral-50/40 hover:ring-coral-200 hover:shadow-lift",
      ].join(" ")}
    >
      {/* Left accent bar */}
      <m.span
        aria-hidden
        initial={false}
        animate={{ opacity: selected ? 1 : 0, scaleY: selected ? 1 : 0.4 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-coral-400 to-coral-600"
      />

      <div className="flex items-start justify-between gap-3">
        <h3
          className={[
            "font-semibold tracking-tight transition-colors",
            selected ? "text-coral-700" : "text-ink-900",
          ].join(" ")}
        >
          {preset.label}
        </h3>
        <span
          className={[
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors shadow-sm",
            selected
              ? "border-coral-600 bg-coral-600 text-white"
              : "border-sand-300 bg-white/80 text-transparent group-hover:border-coral-400 group-hover:bg-white",
          ].join(" ")}
        >
          <AnimatePresence>
            {selected && (
              <m.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 18 }}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </m.span>
            )}
          </AnimatePresence>
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
        {preset.description}
      </p>
    </m.button>
  );
}

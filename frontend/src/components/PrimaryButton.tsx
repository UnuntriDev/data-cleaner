import { m } from "framer-motion";
import type { ReactNode } from "react";
import { Spinner } from "./icons";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  count?: number;
  variant?: "solid" | "ghost";
  fullWidth?: boolean;
  icon?: ReactNode;
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  count,
  variant = "solid",
  fullWidth = false,
  icon,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const solid =
    "sheen bg-gradient-to-br from-coral-500 to-coral-600 text-white " +
    (isDisabled ? "shadow-soft" : "shadow-glow hover:to-coral-700");
  const ghost =
    "glass-strong text-ink-700 ring-1 ring-sand-300 hover:text-ink-900 hover:ring-coral-300";

  return (
    <m.button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.02, y: -2 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={[
        "group relative inline-flex items-center justify-center gap-2.5 rounded-2xl",
        "px-7 py-4 text-[0.95rem] font-semibold tracking-tight",
        "transition-colors duration-200 select-none",
        fullWidth ? "w-full" : "",
        variant === "solid" ? solid : ghost,
        isDisabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
      ].join(" ")}
    >
      {loading ? (
        <Spinner className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {typeof count === "number" && (
        <span
          className={[
            "ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2",
            "text-xs font-bold tabular-nums",
            variant === "solid"
              ? "bg-white/25 text-white"
              : "bg-coral-100 text-coral-700",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </m.button>
  );
}

import { m } from "framer-motion";

interface LandingNavProps {
  /** Scroll to / open the workspace. */
  onStart: () => void;
}

const LINKS = [
  { label: "Funkcje", href: "#features" },
  { label: "Workflow", href: "#workflow" },
];

/** Top nav for the landing page. Links hidden on mobile. */
export function LandingNav({ onStart }: LandingNavProps) {
  return (
    <nav className="flex items-center gap-2 sm:gap-5">
      <ul className="hidden items-center gap-7 md:flex">
        {LINKS.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm font-medium text-ink-500 transition-colors hover:text-coral-600"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <m.button
        type="button"
        onClick={onStart}
        whileHover={{ scale: 1.03, y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        className="sheen inline-flex items-center rounded-full bg-gradient-to-br from-coral-500 to-coral-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-colors duration-200 hover:to-coral-700"
      >
        Otwórz aplikację
      </m.button>
    </nav>
  );
}

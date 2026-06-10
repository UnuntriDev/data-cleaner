import type { ComponentType, SVGProps } from "react";
import { Bolt, Download, Shield } from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const ITEMS: { icon: Icon; label: string }[] = [
  { icon: Shield, label: "Tymczasowe przechowywanie" },
  { icon: Bolt, label: "Przetwarzanie na serwerze" },
  { icon: Download, label: "Eksport CSV/XLSX/JSON" },
];

/** Compact reassurance row sitting beneath the upload area. */
export function TrustBadges() {
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-500">
      {ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral-50 text-coral-600">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium">{label}</span>
        </li>
      ))}
    </ul>
  );
}

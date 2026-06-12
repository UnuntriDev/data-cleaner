import type { Insight, OperationStep } from "./types";

/**
 * Execution order. clean_column_names is last (90) because earlier steps
 * reference original column names.
 */
export const SMART_FIX_ORDER: Record<string, number> = {
  clean_text: 10,
  convert_types: 20,
  handle_missing: 30,
  detect_outliers: 40,
  remove_duplicates: 50,
  clean_column_names: 90,
};

/** Deduplicate and sort selected insights into pipeline steps. */
export function buildSmartFixSteps(insights: Insight[]): OperationStep[] {
  const deduped = new Map<string, OperationStep>();

  for (const insight of insights) {
    for (const step of insight.steps) {
      deduped.set(JSON.stringify([step.operation, step.params]), step);
    }
  }

  return [...deduped.values()].sort((a, b) => {
    const aOrder = SMART_FIX_ORDER[a.operation] ?? 60;
    const bOrder = SMART_FIX_ORDER[b.operation] ?? 60;
    return aOrder - bOrder;
  });
}

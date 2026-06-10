import { describe, expect, it } from "vitest";
import { buildSmartFixSteps } from "./smartFix";
import type { Insight, OperationStep } from "./types";

function insight(steps: OperationStep[]): Insight {
  return {
    code: "x",
    title: "x",
    detail: "x",
    severity: "low",
    count: 1,
    recommended: true,
    column: null,
    steps,
  };
}

describe("buildSmartFixSteps", () => {
  it("deduplicates identical steps coming from different insights", () => {
    const step: OperationStep = {
      operation: "remove_duplicates",
      params: { subset: null, keep: "first" },
    };
    const result = buildSmartFixSteps([insight([step]), insight([step])]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(step);
  });

  it("keeps steps with the same operation but different params", () => {
    const a: OperationStep = {
      operation: "handle_missing",
      params: { strategy: "median", columns: ["Age"] },
    };
    const b: OperationStep = {
      operation: "handle_missing",
      params: { strategy: "mode", columns: ["City"] },
    };
    expect(buildSmartFixSteps([insight([a]), insight([b])])).toHaveLength(2);
  });

  it("orders steps by pipeline priority with clean_column_names last", () => {
    const result = buildSmartFixSteps([
      insight([{ operation: "clean_column_names", params: {} }]),
      insight([{ operation: "remove_duplicates", params: {} }]),
      insight([{ operation: "clean_text", params: {} }]),
      insight([{ operation: "convert_types", params: {} }]),
    ]);
    expect(result.map((s) => s.operation)).toEqual([
      "clean_text",
      "convert_types",
      "remove_duplicates",
      "clean_column_names",
    ]);
  });

  it("slots unknown operations between known ones (default order 60)", () => {
    const result = buildSmartFixSteps([
      insight([{ operation: "clean_column_names", params: {} }]),
      insight([{ operation: "totally_custom", params: {} }]),
      insight([{ operation: "clean_text", params: {} }]),
    ]);
    expect(result.map((s) => s.operation)).toEqual([
      "clean_text",
      "totally_custom",
      "clean_column_names",
    ]);
  });

  it("returns an empty list for no insights", () => {
    expect(buildSmartFixSteps([])).toEqual([]);
  });
});

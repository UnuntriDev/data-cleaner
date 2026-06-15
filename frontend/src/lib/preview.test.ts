import { describe, expect, it } from "vitest";
import {
  classifyCell,
  computeDiff,
  computeQualityCounts,
  findDuplicateRowKeys,
  looksInvalid,
  renderCell,
  sameColumns,
} from "./preview";

describe("renderCell", () => {
  it("renders null/undefined as the empty placeholder", () => {
    expect(renderCell(null)).toBe("—");
    expect(renderCell(undefined)).toBe("—");
  });

  it("stringifies booleans and numbers predictably", () => {
    expect(renderCell(true)).toBe("true");
    expect(renderCell(false)).toBe("false");
    expect(renderCell(0)).toBe("0");
    expect(renderCell(42)).toBe("42");
  });
});

describe("looksInvalid", () => {
  it("flags malformed emails in email-like columns", () => {
    expect(looksInvalid("email", "not-an-email")).toBe(true);
    expect(looksInvalid("e-mail", "user@example.com")).toBe(false);
  });

  it("flags non-numeric values in numeric-like columns", () => {
    expect(looksInvalid("kwota", "abc")).toBe(true);
    expect(looksInvalid("amount", "1 200")).toBe(false);
    expect(looksInvalid("price", "1,5")).toBe(false);
  });

  it("never flags the empty placeholder", () => {
    expect(looksInvalid("email", "—")).toBe(false);
  });
});

describe("classifyCell", () => {
  it("prioritizes empty, then invalid, then duplicate", () => {
    expect(classifyCell("any", "—", true)).toBe("empty");
    expect(classifyCell("email", "bad", true)).toBe("invalid");
    expect(classifyCell("name", "Anna", true)).toBe("duplicate");
    expect(classifyCell("name", "Anna", false)).toBeNull();
  });
});

describe("findDuplicateRowKeys", () => {
  it("returns keys appearing more than once", () => {
    const cols = ["a", "b"];
    const rows = [
      { a: 1, b: 2 },
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];
    const dupes = findDuplicateRowKeys(rows, cols);
    expect(dupes.size).toBe(1);
    expect(dupes.has(JSON.stringify([1, 2]))).toBe(true);
  });
});

describe("computeQualityCounts", () => {
  it("aggregates empty, invalid, and duplicate cells", () => {
    const cols = ["email", "name"];
    const rows = [
      { email: null, name: "Anna" }, // empty
      { email: "bad", name: "Bob" }, // invalid
      { email: "x@y.io", name: "Cara" },
      { email: "x@y.io", name: "Cara" }, // duplicate row → 2 duplicate cells
    ];
    const dupes = findDuplicateRowKeys(rows, cols);
    const counts = computeQualityCounts(rows, cols, dupes);
    expect(counts.empty).toBe(1);
    expect(counts.invalid).toBe(1);
    expect(counts.duplicate).toBe(4);
  });
});

describe("sameColumns", () => {
  it("requires identical order and length", () => {
    expect(sameColumns(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameColumns(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameColumns(["a"], ["a", "b"])).toBe(false);
  });
});

describe("computeDiff", () => {
  const cols = ["name", "amount"];

  it("detects changed cells and aligns by best match", () => {
    const raw = [
      { name: "Anna", amount: "1 200" },
      { name: "Bob", amount: "abc" },
    ];
    const clean = [
      { name: "Anna", amount: "1 200" },
      { name: "Bob", amount: "0" },
    ];
    const diff = computeDiff(raw, clean, cols);
    expect(diff.changedCells).toBe(1);
    expect(diff.removedRows).toBe(0);
    expect(diff.changes.get(1)?.get("amount")).toBe("abc");
    expect(diff.changes.has(0)).toBe(false);
  });

  it("counts orphan raw rows as removed (dedup/drop)", () => {
    const raw = [
      { name: "Anna", amount: "1" },
      { name: "Anna", amount: "1" },
      { name: "Bob", amount: "2" },
    ];
    const clean = [
      { name: "Anna", amount: "1" },
      { name: "Bob", amount: "2" },
    ];
    const diff = computeDiff(raw, clean, cols);
    expect(diff.removedRows).toBe(1);
    expect(diff.changedCells).toBe(0);
  });
});

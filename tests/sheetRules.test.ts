import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv/parseCsv";
import { runRules } from "@/lib/rules/ruleEngine";
import { sampleSheetList } from "@/lib/sample-data/sampleSheetList";

const sheetRuleIds = [
  "sheet-missing-number",
  "sheet-missing-name",
  "sheet-duplicate-number",
  "sheet-number-pattern",
  "sheet-placeholder",
];

describe("sheet rules", () => {
  it("fires every sheet rule against the sample data", () => {
    const result = runRules(parseCsv(sampleSheetList, "sheets.csv"), "sheet-list");
    const ids = new Set(result.issues.map((issue) => issue.ruleId));

    for (const ruleId of sheetRuleIds) {
      expect(ids.has(ruleId)).toBe(true);
    }
  });

  it("reports exact rows and columns for core sheet issues", () => {
    const result = runRules(
      parseCsv("Sheet Number,Sheet Name\nA-101,Plan\n,TBD\nA-101,Other\nBAD-123-X,Valid", "s.csv"),
      "sheet-list",
    );

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "sheet-missing-number", rowNumber: 2, column: "Sheet Number", severity: "critical" }),
        expect.objectContaining({ ruleId: "sheet-placeholder", rowNumber: 2, column: "Sheet Name", severity: "warning" }),
        expect.objectContaining({ ruleId: "sheet-duplicate-number", rowNumber: 1 }),
        expect.objectContaining({ ruleId: "sheet-duplicate-number", rowNumber: 3 }),
        expect.objectContaining({ ruleId: "sheet-number-pattern", rowNumber: 4 }),
      ]),
    );
  });

  it("accepts and rejects sheet number patterns", () => {
    const valid = ["A-101", "A101", "AD-101", "A-101.1", "M-1.02", "S.201"];
    const invalid = ["SHEET-01A-X", "101-A", "A_101", "AAAA-101", "A-12345"];

    for (const number of valid) {
      const result = runRules(parseCsv(`Sheet Number,Sheet Name\n${number},Plan`, "valid.csv"), "sheet-list");
      expect(result.issues.some((issue) => issue.ruleId === "sheet-number-pattern")).toBe(false);
    }

    for (const number of invalid) {
      const result = runRules(parseCsv(`Sheet Number,Sheet Name\n${number},Plan`, "invalid.csv"), "sheet-list");
      expect(result.issues.some((issue) => issue.ruleId === "sheet-number-pattern")).toBe(true);
    }
  });

  it("uses a custom sheet number pattern when configured", () => {
    const parsed = parseCsv("Sheet Number,Sheet Name\nAA-101,Plan\nA-101,Plan", "sheets.csv");
    const result = runRules(parsed, "sheet-list", {
      disabledRuleIds: [],
      sheetPattern: "^[A-Z]{2}-\\d{3}$",
      placeholders: ["tbd"],
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "sheet-number-pattern", rowNumber: 2 }),
      ]),
    );
    expect(result.issues.some((issue) => issue.ruleId === "sheet-number-pattern" && issue.rowNumber === 1)).toBe(false);
  });
});

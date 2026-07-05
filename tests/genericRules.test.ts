import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv/parseCsv";
import { DEFAULT_CONFIG } from "@/lib/config/ruleConfig";
import { runRules } from "@/lib/rules/ruleEngine";

describe("generic rules", () => {
  it("reports sparse rows, duplicate ids, placeholders, and required-looking blanks", () => {
    const result = runRules(
      parseCsv("Asset ID,Name,Notes,Code\nA1,Valve,TBD,C1\nA1,,,\nB2,,,\n", "generic.csv"),
      "generic",
    );

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "generic-sparse-row", rowNumber: 2 }),
        expect.objectContaining({ ruleId: "generic-sparse-row", rowNumber: 3 }),
        expect.objectContaining({ ruleId: "generic-duplicate-id", rowNumber: 1, column: "Asset ID" }),
        expect.objectContaining({ ruleId: "generic-duplicate-id", rowNumber: 2, column: "Asset ID" }),
        expect.objectContaining({ ruleId: "generic-placeholder", rowNumber: 1, column: "Notes" }),
        expect.objectContaining({ ruleId: "generic-empty-required", rowNumber: 2, column: "Name" }),
      ]),
    );
  });

  it("does not report clean generic rows", () => {
    const result = runRules(
      parseCsv("Asset ID,Name,Notes\nA1,Valve,Installed\nA2,Pump,Checked", "clean.csv"),
      "generic",
    );

    expect(result.issues).toHaveLength(0);
  });

  it("uses a custom placeholder list", () => {
    const parsed = parseCsv("Asset ID,Name\nA1,-\nA2,HOLD", "generic.csv");
    const result = runRules(parsed, "generic", {
      disabledRuleIds: [],
      sheetPattern: DEFAULT_CONFIG.sheetPattern,
      placeholders: ["hold"],
    });

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "generic-placeholder", rowNumber: 2 }),
      ]),
    );
    expect(result.issues.some((issue) => issue.ruleId === "generic-placeholder" && issue.rowNumber === 1)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv/parseCsv";
import { runRules } from "@/lib/rules/ruleEngine";
import { sampleViewList } from "@/lib/sample-data/sampleViewList";

describe("view rules", () => {
  it("fires every view rule against the sample data", () => {
    const result = runRules(parseCsv(sampleViewList, "views.csv"), "view-list");
    const ids = new Set(result.issues.map((issue) => issue.ruleId));

    for (const ruleId of [
      "view-missing-name",
      "view-duplicate-name",
      "view-unplaced-missing-sheet",
      "view-placeholder-name",
      "view-naming-pattern",
    ]) {
      expect(ids.has(ruleId)).toBe(true);
    }
  });

  it("reports view issues and skips sheet checks when absent", () => {
    const result = runRules(
      parseCsv("View Name\nA\nA\nCopy 1\n", "views.csv"),
      "view-list",
    );

    expect(result.skippedRules).toContain("view-unplaced-missing-sheet");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "view-duplicate-name", rowNumber: 1 }),
        expect.objectContaining({ ruleId: "view-duplicate-name", rowNumber: 2 }),
        expect.objectContaining({ ruleId: "view-placeholder-name", rowNumber: 3 }),
        expect.objectContaining({ ruleId: "view-naming-pattern", rowNumber: 1 }),
      ]),
    );
  });

  it("does not flag placeholder terms inside other words", () => {
    const result = runRules(
      parseCsv("View Name,Sheet Number\nThreshold Detail,A-1\nContemporary Lobby,A-1\nAttestation Room Plan,A-1", "views.csv"),
      "view-list",
    );

    expect(result.issues.some((issue) => issue.ruleId === "view-placeholder-name")).toBe(false);
  });

  it("still flags explicit placeholder view names", () => {
    const result = runRules(
      parseCsv("View Name,Sheet Number\nOld Lobby Detail,A-1\nCopy of Level 2,A-1\nLevel 2 Copy 1,A-1\ntemp,A-1\nWIP Stair Section,A-1", "views.csv"),
      "view-list",
    );

    const placeholderRows = result.issues
      .filter((issue) => issue.ruleId === "view-placeholder-name")
      .map((issue) => issue.rowNumber);
    expect(placeholderRows).toEqual([1, 2, 3, 4, 5]);
  });
});

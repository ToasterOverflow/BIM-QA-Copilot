import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv/parseCsv";
import { runRules } from "@/lib/rules/ruleEngine";
import { sampleDoorSchedule } from "@/lib/sample-data/sampleDoorSchedule";

describe("door rules", () => {
  it("fires every door rule against the sample data", () => {
    const result = runRules(parseCsv(sampleDoorSchedule, "doors.csv"), "door-schedule");
    const ids = new Set(result.issues.map((issue) => issue.ruleId));

    for (const ruleId of [
      "door-missing-number",
      "door-duplicate-number",
      "door-missing-room",
      "door-missing-fire-rating",
      "door-placeholder",
    ]) {
      expect(ids.has(ruleId)).toBe(true);
    }
  });

  it("reports door issues and skips missing optional columns", () => {
    const result = runRules(parseCsv("Mark\nD-1\nD-1\n", "doors.csv"), "door-schedule");

    expect(result.skippedRules).toEqual(
      expect.arrayContaining(["door-missing-room", "door-missing-fire-rating"]),
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "door-duplicate-number", rowNumber: 1 }),
        expect.objectContaining({ ruleId: "door-duplicate-number", rowNumber: 2 }),
      ]),
    );
  });
});

import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv/parseCsv";
import { runRules } from "@/lib/rules/ruleEngine";
import { sampleRoomSchedule } from "@/lib/sample-data/sampleRoomSchedule";

describe("room rules", () => {
  it("fires every room rule against the sample data", () => {
    const result = runRules(parseCsv(sampleRoomSchedule, "rooms.csv"), "room-schedule");
    const ids = new Set(result.issues.map((issue) => issue.ruleId));

    for (const ruleId of [
      "room-missing-number",
      "room-missing-name",
      "room-duplicate-number",
      "room-missing-level",
      "room-missing-department",
      "room-placeholder",
    ]) {
      expect(ids.has(ruleId)).toBe(true);
    }
  });

  it("reports duplicates, blanks, placeholders, and skipped department", () => {
    const result = runRules(
      parseCsv("Number,Name,Level\n101,Lobby,Level 1\n101,N/A,\n,Office,Level 1", "rooms.csv"),
      "room-schedule",
    );

    expect(result.skippedRules).toContain("room-missing-department");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "room-duplicate-number", rowNumber: 1 }),
        expect.objectContaining({ ruleId: "room-duplicate-number", rowNumber: 2 }),
        expect.objectContaining({ ruleId: "room-placeholder", rowNumber: 2, column: "Name" }),
        expect.objectContaining({ ruleId: "room-missing-level", rowNumber: 2 }),
        expect.objectContaining({ ruleId: "room-missing-number", rowNumber: 3 }),
      ]),
    );
  });
});

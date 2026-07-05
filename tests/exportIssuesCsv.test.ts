import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "@/lib/config/ruleConfig";
import { buildIssuesCsv, makeReportFileName } from "@/lib/export/exportIssuesCsv";
import type { Issue } from "@/types/issue";

const issue: Issue = {
  id: "rule-1-Name",
  ruleId: "rule",
  ruleName: "Rule with comma, quote",
  severity: "critical",
  rowNumber: null,
  column: "Name",
  problem: 'Bad "value", with comma\nand newline',
  suggestedFix: "Fix it",
};

describe("buildIssuesCsv", () => {
  it("builds metadata, header, BOM, and escaped rows with CRLF", () => {
    const csv = buildIssuesCsv([issue], {
      fileName: "Source File.csv",
      scheduleType: "sheet-list",
      ranAt: "2026-07-04T10:00:00.000Z",
      totalIssues: 2,
      filteredCount: 1,
      config: {
        ...DEFAULT_CONFIG,
        disabledRuleIds: ["sheet-placeholder"],
        sheetPattern: "^[A-Z]{2}-\\d{3}$",
      },
      disabledRules: ["sheet-placeholder"],
      skippedRules: ["room-missing-department"],
      failedRules: ["broken-rule"],
    });

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("BIM QA Copilot Report\r\n");
    expect(csv).toContain("Source file: Source File.csv\r\n");
    expect(csv).toContain("Schedule type: Sheet List\r\n");
    expect(csv).toContain("Issues: 1 of 2\r\n");
    expect(csv).toContain("Result: 1 issues\r\n");
    expect(csv).toContain("Disabled rules: 1 (sheet-placeholder)\r\n");
    expect(csv).toContain("Sheet pattern: ^[A-Z]{2}-\\d{3}$\r\n");
    expect(csv).toContain("Skipped rules: 1 (room-missing-department)\r\n");
    expect(csv).toContain("Failed rules: 1 (broken-rule)\r\n");
    expect(csv).toContain("Severity,Row,Column,Rule,Problem,Suggested Fix\r\n");
    expect(csv).toContain('Critical,,Name,"Rule with comma, quote","Bad ""value"", with comma\nand newline",Fix it');
  });

  it("supports an empty issue list", () => {
    const csv = buildIssuesCsv([], {
      fileName: "clean.csv",
      scheduleType: "generic",
      ranAt: "2026-07-04T10:00:00.000Z",
      totalIssues: 0,
      filteredCount: 0,
      config: DEFAULT_CONFIG,
    });

    expect(csv).toContain("Result: PASS — no issues found");
    expect(csv).toContain("Severity,Row,Column,Rule,Problem,Suggested Fix");
    expect(csv.split("\r\n")).toHaveLength(13);
  });
});

describe("makeReportFileName", () => {
  it("sanitizes source names", () => {
    expect(makeReportFileName("My Schedule 01.csv", new Date(2026, 6, 4))).toBe(
      "qa-report-my-schedule-01-2026-07-04.csv",
    );
  });
});

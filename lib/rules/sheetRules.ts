import { DEFAULT_SHEET_PATTERN } from "@/lib/config/ruleConfig";
import { isBlank } from "@/lib/utils/placeholders";
import type { Issue } from "@/types/issue";
import { eachRow, makeIssue } from "./ruleEngine";
import {
  duplicateValueRule,
  missingValueRule,
  placeholderRule,
} from "./ruleFactories";
import type { Rule } from "./types";

const sheetNumberPatternRule: Rule = {
  id: "sheet-number-pattern",
  name: "Sheet number doesn't match expected pattern",
  severity: "warning",
  scheduleType: "sheet-list",
  appliesTo: ({ columns }) => Boolean(columns.sheetNumber),
  check: ({ parsed, columns, config }) => {
    const column = columns.sheetNumber ?? "";
    let pattern = new RegExp(DEFAULT_SHEET_PATTERN);
    try {
      pattern = new RegExp(config.sheetPattern);
    } catch {
      pattern = new RegExp(DEFAULT_SHEET_PATTERN);
    }

    const issues: Issue[] = [];
    eachRow(parsed, (row, rowNumber) => {
      const value = row[column] ?? "";
      if (!isBlank(value) && !pattern.test(value.trim())) {
        issues.push(
          makeIssue(
            sheetNumberPatternRule,
            rowNumber,
            column,
            `Sheet number "${value}" does not match the expected pattern.`,
            "Use the project sheet numbering convention, e.g. 'A-101' (discipline letter, hyphen, number).",
          ),
        );
      }
    });
    return issues;
  },
};

export const sheetRules: Rule[] = [
  missingValueRule({
    id: "sheet-missing-number",
    name: "Missing sheet number",
    severity: "critical",
    scheduleType: "sheet-list",
    field: "sheetNumber",
    label: "Sheet number",
    fileLevelWhenColumnAbsent: true,
  }),
  missingValueRule({
    id: "sheet-missing-name",
    name: "Missing sheet name",
    severity: "critical",
    scheduleType: "sheet-list",
    field: "sheetName",
    label: "Sheet name",
    fileLevelWhenColumnAbsent: true,
  }),
  duplicateValueRule({
    id: "sheet-duplicate-number",
    name: "Duplicate sheet number",
    scheduleType: "sheet-list",
    field: "sheetNumber",
    label: "Sheet number",
  }),
  sheetNumberPatternRule,
  placeholderRule({ id: "sheet-placeholder", scheduleType: "sheet-list" }),
];

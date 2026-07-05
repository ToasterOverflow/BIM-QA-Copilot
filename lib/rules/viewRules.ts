import { isBlank, isPlaceholder } from "@/lib/utils/placeholders";
import type { Issue } from "@/types/issue";
import { eachRow, makeIssue } from "./ruleEngine";
import { duplicateValueRule, missingValueRule } from "./ruleFactories";
import type { Rule } from "./types";

const VIEW_PLACEHOLDER_TERMS = [
  "copy of",
  "copy",
  "working",
  "temp",
  "test",
  "old",
  "wip",
  "draft",
];

function hasPlaceholderTerm(value: string, placeholders: readonly string[]): boolean {
  return (
    isPlaceholder(value, placeholders) ||
    VIEW_PLACEHOLDER_TERMS.some((term) =>
      new RegExp(`\\b${term.replace(/\s+/g, "\\s+")}\\b`, "i").test(value),
    ) ||
    /copy\s*\d*$/i.test(value)
  );
}

const viewUnplacedMissingSheetRule: Rule = {
  id: "view-unplaced-missing-sheet",
  name: "View missing sheet number",
  severity: "info",
  scheduleType: "view-list",
  appliesTo: ({ columns }) => Boolean(columns.viewSheet),
  check: ({ parsed, columns }) => {
    const column = columns.viewSheet ?? "";
    const issues: Issue[] = [];
    eachRow(parsed, (row, rowNumber) => {
      if (isBlank(row[column])) {
        issues.push(
          makeIssue(
            viewUnplacedMissingSheetRule,
            rowNumber,
            column,
            "View is not placed on any sheet (or sheet number missing).",
            "Place the view on a sheet, or mark it as a working view per your view-naming convention.",
          ),
        );
      }
    });
    return issues;
  },
};

const viewPlaceholderNameRule: Rule = {
  id: "view-placeholder-name",
  name: "Placeholder term in view name",
  severity: "warning",
  scheduleType: "view-list",
  appliesTo: ({ columns }) => Boolean(columns.viewName),
  check: ({ parsed, columns, config }) => {
    const column = columns.viewName ?? "";
    const issues: Issue[] = [];
    eachRow(parsed, (row, rowNumber) => {
      const value = row[column] ?? "";
      if (!isBlank(value) && hasPlaceholderTerm(value, config.placeholders)) {
        issues.push(
          makeIssue(
            viewPlaceholderNameRule,
            rowNumber,
            column,
            `View name "${value}" contains a placeholder or working term.`,
            "Replace working, copied, or placeholder view names before issuing.",
          ),
        );
      }
    });
    return issues;
  },
};

const viewNamingPatternRule: Rule = {
  id: "view-naming-pattern",
  name: "Unclear naming pattern",
  severity: "info",
  scheduleType: "view-list",
  appliesTo: ({ columns }) => Boolean(columns.viewName),
  check: ({ parsed, columns }) => {
    const column = columns.viewName ?? "";
    const issues: Issue[] = [];
    eachRow(parsed, (row, rowNumber) => {
      const value = row[column] ?? "";
      const trimmed = value.trim();
      const lacksSeparator = !/[-_:]/.test(trimmed);
      const unclearShortWord = /^[A-Za-z0-9]{1,3}$/.test(trimmed);
      const numericOnly = /^\d+$/.test(trimmed);
      if (!isBlank(trimmed) && lacksSeparator && (unclearShortWord || numericOnly)) {
        issues.push(
          makeIssue(
            viewNamingPatternRule,
            rowNumber,
            column,
            "View name may be unclear; consider a consistent naming convention like 'LEVEL - DISCIPLINE - DESCRIPTION'.",
            "Adopt a consistent view naming convention, e.g. 'LEVEL - DISCIPLINE - DESCRIPTION'.",
          ),
        );
      }
    });
    return issues;
  },
};

export const viewRules: Rule[] = [
  missingValueRule({
    id: "view-missing-name",
    name: "Missing view name",
    severity: "critical",
    scheduleType: "view-list",
    field: "viewName",
    label: "View name",
    fileLevelWhenColumnAbsent: true,
  }),
  duplicateValueRule({
    id: "view-duplicate-name",
    name: "Duplicate view name",
    scheduleType: "view-list",
    field: "viewName",
    label: "View name",
  }),
  viewUnplacedMissingSheetRule,
  viewPlaceholderNameRule,
  viewNamingPatternRule,
];

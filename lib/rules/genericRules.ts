import { isBlank, isPlaceholder } from "@/lib/utils/placeholders";
import { normalizeHeader } from "@/lib/utils/strings";
import type { Issue } from "@/types/issue";
import type { Rule } from "./types";
import { eachRow, findDuplicates, makeIssue } from "./ruleEngine";

function isIdLikeHeader(header: string): boolean {
  const normalized = normalizeHeader(header);
  return ["number", "no", "id", "mark", "code"].some((token) =>
    normalized.includes(token),
  );
}

function isRequiredLookingHeader(header: string): boolean {
  return isIdLikeHeader(header) || normalizeHeader(header).includes("name");
}

const genericSparseRowRule: Rule = {
  id: "generic-sparse-row",
  name: "Row mostly blank",
  severity: "warning",
  scheduleType: "generic",
  check: ({ parsed }) => {
    const issues: Issue[] = [];
    eachRow(parsed, (row, rowNumber) => {
      const values = parsed.headers.map((header) => row[header]);
      const blankCount = values.filter(isBlank).length;
      if (parsed.headers.length >= 2 && blankCount / parsed.headers.length > 0.5) {
        issues.push(
          makeIssue(
            genericSparseRowRule,
            rowNumber,
            "",
            `${blankCount} of ${parsed.headers.length} fields are blank.`,
            "Complete the row's data in Revit, or delete the row if it's an artifact.",
          ),
        );
      }
    });
    return issues;
  },
};

const genericDuplicateIdRule: Rule = {
  id: "generic-duplicate-id",
  name: "Duplicate value in ID-like column",
  severity: "warning",
  scheduleType: "generic",
  check: ({ parsed }) => {
    const issues: Issue[] = [];
    for (const column of parsed.headers.filter(isIdLikeHeader)) {
      for (const [value, rowNumbers] of findDuplicates(
        parsed.rows,
        column,
      ).entries()) {
        for (const rowNumber of rowNumbers) {
          issues.push(
            makeIssue(
              genericDuplicateIdRule,
              rowNumber,
              column,
              `Value "${value}" is duplicated in ID-like column "${column}".`,
              "Renumber so each ID-like value is unique; duplicates break referencing and drawing coordination.",
            ),
          );
        }
      }
    }
    return issues;
  },
};

const genericPlaceholderRule: Rule = {
  id: "generic-placeholder",
  name: "Placeholder value",
  severity: "warning",
  scheduleType: "generic",
  check: ({ parsed, config }) => {
    const issues: Issue[] = [];
    eachRow(parsed, (row, rowNumber) => {
      for (const [column, value] of Object.entries(row)) {
        if (isPlaceholder(value, config.placeholders)) {
          issues.push(
            makeIssue(
              genericPlaceholderRule,
              rowNumber,
              column,
              `Placeholder value "${value}" found.`,
              `Replace the placeholder '${value}' with the final value before issuing.`,
            ),
          );
        }
      }
    });
    return issues;
  },
};

const genericEmptyRequiredRule: Rule = {
  id: "generic-empty-required",
  name: "Empty required-looking field",
  severity: "info",
  scheduleType: "generic",
  check: ({ parsed }) => {
    const issues: Issue[] = [];
    const requiredColumns = parsed.headers.filter(isRequiredLookingHeader);
    eachRow(parsed, (row, rowNumber) => {
      for (const column of requiredColumns) {
        if (isBlank(row[column])) {
          issues.push(
            makeIssue(
              genericEmptyRequiredRule,
              rowNumber,
              column,
              `Required-looking field "${column}" is blank.`,
              "Fill in the field in Revit and re-export the schedule.",
            ),
          );
        }
      }
    });
    return issues;
  },
};

export const genericRules: Rule[] = [
  genericSparseRowRule,
  genericDuplicateIdRule,
  genericPlaceholderRule,
  genericEmptyRequiredRule,
];

import { isBlank, isPlaceholder } from "@/lib/utils/placeholders";
import type { Issue, Severity } from "@/types/issue";
import type { ScheduleType } from "@/types/schedule";
import { eachRow, findDuplicates, makeIssue } from "./ruleEngine";
import type { Rule } from "./types";

interface MissingValueRuleOptions {
  id: string;
  name: string;
  severity: Severity;
  scheduleType: ScheduleType;
  field: string;
  label: string;
  fileLevelWhenColumnAbsent: boolean;
  absentProblem?: string;
  absentFix?: string;
  blankProblem?: string;
  blankFix?: string;
}

interface DuplicateValueRuleOptions {
  id: string;
  name: string;
  scheduleType: ScheduleType;
  field: string;
  label: string;
}

interface PlaceholderRuleOptions {
  id: string;
  scheduleType: Exclude<ScheduleType, "generic">;
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

export function missingValueRule(options: MissingValueRuleOptions): Rule {
  const rule: Rule = {
    id: options.id,
    name: options.name,
    severity: options.severity,
    scheduleType: options.scheduleType,
    appliesTo: options.fileLevelWhenColumnAbsent
      ? undefined
      : ({ columns }) => Boolean(columns[options.field]),
    check: ({ parsed, columns }) => {
      const column = columns[options.field];
      if (!column) {
        return [
          makeIssue(
            rule,
            null,
            "",
            options.absentProblem ?? `No ${lowerFirst(options.label)} column found.`,
            options.absentFix ??
              `Add a ${lowerFirst(options.label)} column to the Revit schedule and re-export it.`,
          ),
        ];
      }

      const issues: Issue[] = [];
      eachRow(parsed, (row, rowNumber) => {
        if (isBlank(row[column])) {
          issues.push(
            makeIssue(
              rule,
              rowNumber,
              column,
              options.blankProblem ?? `${options.label} is blank.`,
              options.blankFix ??
                `Fill in the ${lowerFirst(options.label)} in Revit and re-export the schedule.`,
            ),
          );
        }
      });
      return issues;
    },
  };

  return rule;
}

export function duplicateValueRule(options: DuplicateValueRuleOptions): Rule {
  const rule: Rule = {
    id: options.id,
    name: options.name,
    severity: "critical",
    scheduleType: options.scheduleType,
    appliesTo: ({ columns }) => Boolean(columns[options.field]),
    check: ({ parsed, columns }) => {
      const column = columns[options.field] ?? "";
      const issues: Issue[] = [];
      for (const [value, rowNumbers] of findDuplicates(
        parsed.rows,
        column,
      ).entries()) {
        for (const rowNumber of rowNumbers) {
          issues.push(
            makeIssue(
              rule,
              rowNumber,
              column,
              `${options.label} "${value}" is duplicated.`,
              `Renumber so each ${lowerFirst(options.label)} is unique; duplicates break referencing and drawing coordination.`,
            ),
          );
        }
      }
      return issues;
    },
  };

  return rule;
}

export function placeholderRule(options: PlaceholderRuleOptions): Rule {
  const rule: Rule = {
    id: options.id,
    name: "Placeholder value",
    severity: "warning",
    scheduleType: options.scheduleType,
    check: ({ parsed, config }) => {
      const issues: Issue[] = [];
      eachRow(parsed, (row, rowNumber) => {
        for (const [column, value] of Object.entries(row)) {
          if (isPlaceholder(value, config.placeholders)) {
            issues.push(
              makeIssue(
                rule,
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

  return rule;
}

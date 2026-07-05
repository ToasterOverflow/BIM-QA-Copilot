import { detectColumns } from "@/lib/csv/detectColumns";
import { DEFAULT_CONFIG, normalizeConfig } from "@/lib/config/ruleConfig";
import { isBlank } from "@/lib/utils/placeholders";
import type { Issue, Severity } from "@/types/issue";
import type { ParsedCsv, ScheduleRow, ScheduleType } from "@/types/schedule";
import { doorRules } from "./doorRules";
import { genericRules } from "./genericRules";
import { roomRules } from "./roomRules";
import { sheetRules } from "./sheetRules";
import type { Rule, RuleResult, RowVisitor } from "./types";
import { viewRules } from "./viewRules";

const severityOrder: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export const RULE_REGISTRY: Record<ScheduleType, Rule[]> = {
  "sheet-list": sheetRules,
  "room-schedule": roomRules,
  "door-schedule": doorRules,
  "view-list": viewRules,
  generic: genericRules,
};

export function makeIssue(
  rule: Pick<Rule, "id" | "name" | "severity">,
  rowNumber: number | null,
  column: string,
  problem: string,
  suggestedFix: string,
): Issue {
  return {
    id: `${rule.id}-${rowNumber ?? "file"}-${column}`,
    ruleId: rule.id,
    ruleName: rule.name,
    severity: rule.severity,
    rowNumber,
    column,
    problem,
    suggestedFix,
  };
}

export function eachRow(parsed: ParsedCsv, fn: RowVisitor): void {
  parsed.rows.forEach((row, index) => fn(row, index + 1));
}

export function findDuplicates(
  rows: ScheduleRow[],
  header: string,
): Map<string, number[]> {
  const allValues = new Map<string, number[]>();
  const duplicates = new Map<string, number[]>();

  rows.forEach((row, index) => {
    const value = row[header];
    if (isBlank(value)) {
      return;
    }

    const normalized = value.trim().toLowerCase();
    allValues.set(normalized, [...(allValues.get(normalized) ?? []), index + 1]);
  });

  for (const [value, rowNumbers] of allValues.entries()) {
    if (rowNumbers.length > 1) {
      duplicates.set(value, rowNumbers);
    }
  }

  return duplicates;
}

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    const aRow = a.rowNumber ?? -1;
    const bRow = b.rowNumber ?? -1;
    if (aRow !== bRow) {
      return aRow - bRow;
    }

    return a.ruleId.localeCompare(b.ruleId);
  });
}

export function runRules(
  parsed: ParsedCsv,
  scheduleType: ScheduleType,
  config = DEFAULT_CONFIG,
): RuleResult {
  const rules = RULE_REGISTRY[scheduleType] ?? [];
  const columns = detectColumns(parsed.headers, scheduleType);
  const normalizedConfig = normalizeConfig(config);
  const skippedRules: string[] = [];
  const failedRules: string[] = [];
  const disabledRules: string[] = [];
  const issues: Issue[] = [];

  for (const rule of rules) {
    if (normalizedConfig.disabledRuleIds.includes(rule.id)) {
      disabledRules.push(rule.id);
      continue;
    }

    try {
      const ctx = { parsed, columns, config: normalizedConfig };
      if (rule.appliesTo && !rule.appliesTo(ctx)) {
        skippedRules.push(rule.id);
        continue;
      }

      issues.push(...rule.check(ctx));
    } catch (error) {
      failedRules.push(rule.id);
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
    }
  }

  return {
    scheduleType,
    issues: sortIssues(issues),
    skippedRules,
    failedRules,
    disabledRules,
    ranAt: new Date().toISOString(),
  };
}

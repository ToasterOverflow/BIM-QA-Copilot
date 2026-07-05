import type { Issue, Severity } from "@/types/issue";
import type { RuleConfig } from "@/lib/config/ruleConfig";
import type { ParsedCsv, ScheduleRow, ScheduleType } from "@/types/schedule";

export type ColumnMap = Record<string, string | null>;

export interface RuleContext {
  parsed: ParsedCsv;
  columns: ColumnMap;
  config: RuleConfig;
}

export interface Rule {
  id: string;
  name: string;
  severity: Severity;
  scheduleType: ScheduleType;
  appliesTo?(ctx: RuleContext): boolean;
  check(ctx: RuleContext): Issue[];
}

export interface RuleResult {
  scheduleType: ScheduleType;
  issues: Issue[];
  skippedRules: string[];
  failedRules: string[];
  disabledRules: string[];
  ranAt: string;
}

export type RowVisitor = (row: ScheduleRow, rowNumber: number) => void;

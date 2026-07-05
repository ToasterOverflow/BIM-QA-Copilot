export type Severity = "critical" | "warning" | "info";

export interface Issue {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  rowNumber: number | null;
  column: string;
  problem: string;
  suggestedFix: string;
}

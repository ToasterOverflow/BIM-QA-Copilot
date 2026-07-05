import { DEFAULT_CONFIG } from "@/lib/config/ruleConfig";
import type { RuleConfig } from "@/lib/config/ruleConfig";
import type { Issue } from "@/types/issue";
import type { ScheduleType } from "@/types/schedule";
import { formatScheduleType } from "@/lib/utils/strings";

interface ExportMeta {
  fileName: string;
  scheduleType: ScheduleType;
  ranAt: string;
  totalIssues: number;
  filteredCount: number;
  config?: RuleConfig;
  disabledRules?: string[];
  skippedRules?: string[];
  failedRules?: string[];
}

function escapeCsvField(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function row(values: Array<string | number>): string {
  return values.map(escapeCsvField).join(",");
}

function idsLine(label: string, ids: string[] | undefined): string {
  return `${label}: ${ids?.length ?? 0}${ids && ids.length > 0 ? ` (${ids.join("; ")})` : ""}`;
}

export function buildIssuesCsv(issues: Issue[], meta: ExportMeta): string {
  const config = meta.config ?? DEFAULT_CONFIG;
  const lines = [
    row(["BIM QA Copilot Report"]),
    row([`Source file: ${meta.fileName}`]),
    row([`Schedule type: ${formatScheduleType(meta.scheduleType)}`]),
    row([`Checked at: ${meta.ranAt}`]),
    row([`Issues: ${meta.filteredCount} of ${meta.totalIssues}`]),
    row([
      meta.totalIssues === 0
        ? "Result: PASS — no issues found"
        : `Result: ${meta.totalIssues} issues`,
    ]),
    row([idsLine("Disabled rules", meta.disabledRules)]),
    row([
      config.sheetPattern === DEFAULT_CONFIG.sheetPattern
        ? "Sheet pattern: default"
        : `Sheet pattern: ${config.sheetPattern}`,
    ]),
    row([`Placeholder values: ${config.placeholders.join("; ")}`]),
    row([idsLine("Skipped rules", meta.skippedRules)]),
    row([idsLine("Failed rules", meta.failedRules)]),
    "",
    row(["Severity", "Row", "Column", "Rule", "Problem", "Suggested Fix"]),
  ];

  for (const issue of issues) {
    lines.push(
      row([
        capitalize(issue.severity),
        issue.rowNumber ?? "",
        issue.column,
        issue.ruleName,
        issue.problem,
        issue.suggestedFix,
      ]),
    );
  }

  return `\uFEFF${lines.join("\r\n")}`;
}

function localDateStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function makeReportFileName(sourceFileName: string, date = new Date()): string {
  const baseName = sourceFileName.replace(/\.[^.]+$/, "");
  const safeBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `qa-report-${safeBaseName || "schedule"}-${localDateStamp(date)}.csv`;
}

export function downloadCsv(csv: string, downloadName: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = downloadName;
  anchor.click();
  URL.revokeObjectURL(url);
}

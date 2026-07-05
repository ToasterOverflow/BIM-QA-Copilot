"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RuleConfigPanel } from "@/components/config/RuleConfigPanel";
import { SeveritySummary } from "@/components/dashboard/SeveritySummary";
import { IssueFilters } from "@/components/issues/IssueFilters";
import { IssueTable } from "@/components/issues/IssueTable";
import { DataPreview } from "@/components/preview/DataPreview";
import { ScheduleTypeSelector } from "@/components/preview/ScheduleTypeSelector";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileUpload } from "@/components/upload/FileUpload";
import { parseCsv } from "@/lib/csv/parseCsv";
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
} from "@/lib/config/ruleConfig";
import type { RuleConfig } from "@/lib/config/ruleConfig";
import { suggestScheduleType } from "@/lib/csv/detectColumns";
import { validateCsv } from "@/lib/csv/validateCsv";
import {
  buildIssuesCsv,
  downloadCsv,
  makeReportFileName,
} from "@/lib/export/exportIssuesCsv";
import { RULE_REGISTRY, runRules } from "@/lib/rules/ruleEngine";
import { formatScheduleType } from "@/lib/utils/strings";
import type { Severity } from "@/types/issue";
import type { ParsedCsv, ScheduleType } from "@/types/schedule";
import type { RuleResult } from "@/lib/rules/types";

const allSeverities: Severity[] = ["critical", "warning", "info"];

function getRuleName(ruleId: string): string {
  for (const rules of Object.values(RULE_REGISTRY)) {
    const rule = rules.find((candidate) => candidate.id === ruleId);
    if (rule) {
      return rule.name;
    }
  }
  return ruleId;
}

export default function Home() {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [scheduleType, setScheduleType] = useState<ScheduleType | null>(null);
  const [suggestedType, setSuggestedType] = useState<ScheduleType>("generic");
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<RuleResult | null>(null);
  const [activeSeverities, setActiveSeverities] = useState<Set<Severity>>(new Set());
  const [activeRuleIds, setActiveRuleIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [config, setConfig] = useState<RuleConfig>(DEFAULT_CONFIG);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  function updateConfig(nextConfig: RuleConfig) {
    setConfig(nextConfig);
    saveConfig(nextConfig);
    resetDownstream();
  }

  function clearFilters() {
    setActiveSeverities(new Set());
    setActiveRuleIds(new Set());
    setSearch("");
  }

  function resetDownstream() {
    setResult(null);
    clearFilters();
  }

  function handleFileText(text: string, fileName: string) {
    try {
      const nextParsed = parseCsv(text, fileName);
      const warnings = [...nextParsed.warnings, ...validateCsv(nextParsed)];
      const parsedWithWarnings = { ...nextParsed, warnings };
      const suggested = suggestScheduleType(parsedWithWarnings.headers);

      setParsed(parsedWithWarnings);
      setSuggestedType(suggested);
      setScheduleType(suggested);
      setParseError(null);
      resetDownstream();
    } catch (error) {
      setParsed(null);
      setScheduleType(null);
      setResult(null);
      setParseError(error instanceof Error ? error.message : "Could not parse CSV file.");
    }
  }

  function handleScheduleTypeChange(type: ScheduleType) {
    setScheduleType(type);
    resetDownstream();
  }

  function runChecks() {
    if (!parsed || !scheduleType) {
      return;
    }

    setResult(runRules(parsed, scheduleType, config));
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function toggleSeverity(severity: Severity) {
    setActiveSeverities((current) => {
      const next = new Set(current.size === 0 ? allSeverities : current);
      if (next.has(severity)) {
        next.delete(severity);
      } else {
        next.add(severity);
      }
      return next.size === allSeverities.length || next.size === 0 ? new Set() : next;
    });
  }

  function toggleRule(ruleId: string) {
    setActiveRuleIds((current) => {
      const next = new Set(current);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  }

  const ruleFilters = useMemo(() => {
    if (!result) {
      return [];
    }

    const counts = new Map<string, { id: string; name: string; count: number }>();
    for (const issue of result.issues) {
      const existing = counts.get(issue.ruleId);
      counts.set(issue.ruleId, {
        id: issue.ruleId,
        name: issue.ruleName,
        count: (existing?.count ?? 0) + 1,
      });
    }

    return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [result]);

  const filteredIssues = useMemo(() => {
    if (!result) {
      return [];
    }

    const normalizedSearch = search.trim().toLowerCase();
    return result.issues.filter((issue) => {
      const matchesSeverity =
        activeSeverities.size === 0 || activeSeverities.has(issue.severity);
      const matchesRule =
        activeRuleIds.size === 0 || activeRuleIds.has(issue.ruleId);
      const searchable = [
        issue.ruleName,
        issue.problem,
        issue.column,
        issue.suggestedFix,
        String(issue.rowNumber ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        normalizedSearch === "" || searchable.includes(normalizedSearch);

      return matchesSeverity && matchesRule && matchesSearch;
    });
  }, [activeRuleIds, activeSeverities, result, search]);

  function exportReport() {
    if (!parsed || !result || !scheduleType) {
      return;
    }

    const csv = buildIssuesCsv(filteredIssues, {
      fileName: parsed.fileName,
      scheduleType,
      ranAt: result.ranAt,
      totalIssues: result.issues.length,
      filteredCount: filteredIssues.length,
      config,
      disabledRules: result.disabledRules,
      skippedRules: result.skippedRules,
      failedRules: result.failedRules,
    });

    downloadCsv(csv, makeReportFileName(parsed.fileName));
  }

  const hasActiveFilters =
    activeSeverities.size > 0 || activeRuleIds.size > 0 || search.trim() !== "";
  const skippedRuleNames =
    result?.skippedRules.map(getRuleName).sort((a, b) => a.localeCompare(b)) ?? [];
  const failedRuleNames =
    result?.failedRules.map(getRuleName).sort((a, b) => a.localeCompare(b)) ?? [];
  const disabledRuleNames =
    result?.disabledRules.map(getRuleName).sort((a, b) => a.localeCompare(b)) ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-slate-50/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-normal text-slate-950">
              BIM QA Copilot
            </h1>
            <p className="text-sm text-slate-600">Revit schedule QA checker</p>
          </div>
          <p className="text-sm text-slate-500">Local-first CSV QA</p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-8">
        {parseError ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Could not load schedule</p>
            <p className="mt-1">{parseError}</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => setParseError(null)}
            >
              Try again
            </Button>
          </section>
        ) : null}

        {!parsed ? (
          <>
            <FileUpload onFileText={handleFileText} onError={setParseError} />
            <EmptyState
              title="No schedule loaded"
              description="Upload a Revit CSV export to preview data, choose a schedule type, and run BIM QA checks."
            />
          </>
        ) : (
          <>
            <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-950">{parsed.fileName}</p>
                <p className="text-sm text-slate-600">
                  {parsed.rowCount} rows, {parsed.headers.length} columns, suggested {formatScheduleType(suggestedType)}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setParsed(null);
                  setScheduleType(null);
                  resetDownstream();
                }}
              >
                Replace file
              </Button>
            </section>

            {scheduleType ? (
              <ScheduleTypeSelector
                value={scheduleType}
                suggested={suggestedType}
                onChange={handleScheduleTypeChange}
              />
            ) : null}

            {scheduleType ? (
              <RuleConfigPanel
                scheduleType={scheduleType}
                config={config}
                onChange={updateConfig}
              />
            ) : null}

            <DataPreview parsed={parsed} />

            <div className="flex justify-end">
              <Button onClick={runChecks} disabled={!scheduleType}>
                Run QA checks
              </Button>
            </div>
          </>
        )}

        {result ? (
          <section ref={resultsRef} className="flex scroll-mt-4 flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Issue dashboard</h2>
                <p className="text-sm text-slate-600">
                  Checked {formatScheduleType(result.scheduleType)} at {new Date(result.ranAt).toLocaleString()}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={exportReport}
              >
                Export report (CSV)
              </Button>
            </div>

            <SeveritySummary
              issues={result.issues}
              activeSeverities={activeSeverities}
              onToggle={toggleSeverity}
            />

            {skippedRuleNames.length > 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                {skippedRuleNames.length} checks skipped (columns not found):{" "}
                {skippedRuleNames.join(", ")}
              </p>
            ) : null}

            {failedRuleNames.length > 0 ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {failedRuleNames.length} checks failed to run:{" "}
                {failedRuleNames.join(", ")}
              </p>
            ) : null}

            {disabledRuleNames.length > 0 ? (
              <p className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600">
                {disabledRuleNames.length} checks disabled:{" "}
                {disabledRuleNames.join(", ")}
              </p>
            ) : null}

            {result.issues.length > 0 ? (
              <IssueFilters
                rules={ruleFilters}
                activeRuleIds={activeRuleIds}
                onToggleRule={toggleRule}
                search={search}
                onSearch={setSearch}
                onClear={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            ) : null}

            <IssueTable
              issues={filteredIssues}
              totalCount={result.issues.length}
              onClearFilters={clearFilters}
            />
          </section>
        ) : null}
      </main>

      <footer className="border-t border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
        Local-first. Your data never leaves this browser.
      </footer>
    </div>
  );
}

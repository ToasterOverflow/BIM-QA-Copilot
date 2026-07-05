"use client";

import type { Severity } from "@/types/issue";
import type { Issue } from "@/types/issue";

interface SeveritySummaryProps {
  issues: Issue[];
  activeSeverities: Set<Severity>;
  onToggle(severity: Severity): void;
}

const severities: Array<{ severity: Severity; label: string; className: string }> = [
  {
    severity: "critical",
    label: "Critical",
    className: "bg-red-50 text-red-700 ring-red-100",
  },
  {
    severity: "warning",
    label: "Warning",
    className: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    severity: "info",
    label: "Info",
    className: "bg-blue-50 text-blue-700 ring-blue-100",
  },
];

export function SeveritySummary({
  issues,
  activeSeverities,
  onToggle,
}: SeveritySummaryProps) {
  if (issues.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <span className="font-semibold">No issues found.</span> Schedule looks clean.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {severities.map(({ severity, label, className }) => {
        const count = issues.filter((issue) => issue.severity === severity).length;
        const active = activeSeverities.size === 0 || activeSeverities.has(severity);
        return (
          <button
            key={severity}
            type="button"
            onClick={() => onToggle(severity)}
            className={`rounded-lg p-4 text-left ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
              active ? "ring-2 ring-slate-500" : "opacity-55"
            } ${className}`}
          >
            <span className="block text-2xl font-semibold">{count}</span>
            <span className="text-sm font-medium">{label}</span>
          </button>
        );
      })}
      <div className="rounded-lg bg-slate-200 p-4 text-slate-700 ring-1 ring-slate-300">
        <span className="block text-2xl font-semibold">{issues.length}</span>
        <span className="text-sm font-medium">Total issues</span>
      </div>
    </div>
  );
}

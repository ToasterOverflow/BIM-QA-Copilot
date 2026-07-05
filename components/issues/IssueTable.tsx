"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Issue } from "@/types/issue";
import { IssueDetail } from "./IssueDetail";

interface IssueTableProps {
  issues: Issue[];
  totalCount: number;
  onClearFilters(): void;
}

const gridColumns =
  "grid-cols-[120px_72px_150px_220px_minmax(240px,1fr)]";

export function IssueTable({ issues, totalCount, onClearFilters }: IssueTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isFiltered = issues.length !== totalCount;

  if (issues.length === 0 && totalCount > 0) {
    return (
      <EmptyState
        title="No issues match your filters"
        description="Clear filters to return to the full issue list."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-100">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-950">
          {isFiltered ? `${issues.length} of ${totalCount} issues` : `${issues.length} issues`}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <div
          role="table"
          aria-label="QA issues"
          className="min-w-[802px] text-left text-sm"
        >
          <div
            role="row"
            className={`grid ${gridColumns} bg-slate-200 text-xs uppercase tracking-normal text-slate-600`}
          >
            {["Severity", "Row", "Column", "Rule", "Problem"].map((label) => (
              <div key={label} role="columnheader" className="px-4 py-2 font-semibold">
                {label}
              </div>
            ))}
          </div>

          {issues.map((issue) => {
            const expanded = expandedId === issue.id;
            return (
              <div key={issue.id} role="rowgroup" className="border-t border-slate-200">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : issue.id)}
                  className={`grid w-full ${gridColumns} items-center text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500`}
                >
                  <span role="cell" className="px-4 py-3">
                    <Badge severity={issue.severity}>{issue.severity}</Badge>
                  </span>
                  <span role="cell" className="px-4 py-3 text-slate-600">
                    {issue.rowNumber ?? "-"}
                  </span>
                  <span
                    role="cell"
                    className="truncate px-4 py-3 text-slate-700"
                    title={issue.column}
                  >
                    {issue.column || "-"}
                  </span>
                  <span
                    role="cell"
                    className="truncate px-4 py-3 font-medium text-slate-900"
                    title={issue.ruleName}
                  >
                    {issue.ruleName}
                  </span>
                  <span
                    role="cell"
                    className="truncate px-4 py-3 text-slate-700"
                    title={issue.problem}
                  >
                    {issue.problem}
                  </span>
                </button>
                {expanded ? (
                  <div className="px-4 pb-4">
                    <IssueDetail issue={issue} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

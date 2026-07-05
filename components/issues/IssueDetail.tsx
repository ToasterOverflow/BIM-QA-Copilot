import { Badge } from "@/components/ui/Badge";
import type { Issue } from "@/types/issue";

interface IssueDetailProps {
  issue: Issue;
}

export function IssueDetail({ issue }: IssueDetailProps) {
  return (
    <div className="grid gap-3 rounded-md bg-slate-100 p-4 text-sm text-slate-700 md:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-slate-500">Rule</p>
        <p className="mt-1 font-medium text-slate-950">{issue.ruleName}</p>
        <p className="text-xs text-slate-500">{issue.ruleId}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-slate-500">Severity</p>
        <p className="mt-1">
          <Badge severity={issue.severity}>{issue.severity}</Badge>
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-slate-500">Location</p>
        <p className="mt-1">
          Row {issue.rowNumber ?? "-"} {issue.column ? `- ${issue.column}` : ""}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-slate-500">Problem</p>
        <p className="mt-1">{issue.problem}</p>
      </div>
      <div className="md:col-span-2">
        <p className="text-xs font-medium uppercase tracking-normal text-slate-500">Suggested fix</p>
        <p className="mt-1 rounded-md border border-slate-300 bg-slate-50 p-3 text-slate-900">
          {issue.suggestedFix}
        </p>
      </div>
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/Button";

interface RuleFilter {
  id: string;
  name: string;
  count: number;
}

interface IssueFiltersProps {
  rules: RuleFilter[];
  activeRuleIds: Set<string>;
  onToggleRule(ruleId: string): void;
  search: string;
  onSearch(value: string): void;
  onClear(): void;
  hasActiveFilters: boolean;
}

export function IssueFilters({
  rules,
  activeRuleIds,
  onToggleRule,
  search,
  onSearch,
  onClear,
  hasActiveFilters,
}: IssueFiltersProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-100 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="block md:min-w-80">
          <span className="sr-only">Search issues</span>
          <input
            aria-label="Search issues"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search issues"
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
          />
        </label>
        {hasActiveFilters ? (
          <Button variant="ghost" onClick={onClear}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {rules.map((rule) => {
          const active = activeRuleIds.size === 0 || activeRuleIds.has(rule.id);
          return (
            <button
              key={rule.id}
              type="button"
              onClick={() => onToggleRule(rule.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
                active
                  ? "border-slate-900 bg-slate-900 text-slate-50"
                  : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {rule.name} ({rule.count})
            </button>
          );
        })}
      </div>
    </section>
  );
}

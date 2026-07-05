"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CONFIG } from "@/lib/config/ruleConfig";
import type { RuleConfig } from "@/lib/config/ruleConfig";
import { RULE_REGISTRY } from "@/lib/rules/ruleEngine";
import type { ScheduleType } from "@/types/schedule";
import { formatScheduleType } from "@/lib/utils/strings";

interface RuleConfigPanelProps {
  scheduleType: ScheduleType;
  config: RuleConfig;
  onChange(config: RuleConfig): void;
}

function parsePlaceholderInput(value: string): string[] {
  const parsed = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return parsed.length > 0 ? [...new Set(parsed)] : DEFAULT_CONFIG.placeholders;
}

export function RuleConfigPanel({
  scheduleType,
  config,
  onChange,
}: RuleConfigPanelProps) {
  const rules = RULE_REGISTRY[scheduleType] ?? [];
  // ponytail: raw text lives in local state so typing isn't re-normalized per
  // keystroke; the parsed list commits to config on blur.
  const [placeholderText, setPlaceholderText] = useState(
    config.placeholders.join(", "),
  );

  useEffect(() => {
    setPlaceholderText(config.placeholders.join(", "));
  }, [config.placeholders]);

  const patternError = useMemo(() => {
    try {
      new RegExp(config.sheetPattern);
      return null;
    } catch {
      return "Invalid regex. QA checks will fall back to the default sheet pattern.";
    }
  }, [config.sheetPattern]);

  function toggleRule(ruleId: string) {
    const disabled = new Set(config.disabledRuleIds);
    if (disabled.has(ruleId)) {
      disabled.delete(ruleId);
    } else {
      disabled.add(ruleId);
    }
    onChange({ ...config, disabledRuleIds: [...disabled].sort() });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-100 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Configure checks</h2>
          <p className="text-sm text-slate-600">
            Active rule set: {formatScheduleType(scheduleType)}
          </p>
        </div>
        {config.disabledRuleIds.length > 0 ? (
          <p className="text-xs text-slate-500">
            {config.disabledRuleIds.length} disabled
          </p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-normal text-slate-500">
            Rule toggles
          </p>
          <div className="mt-2 grid gap-2">
            {rules.map((rule) => (
              <label
                key={rule.id}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                <input
                  type="checkbox"
                  checked={!config.disabledRuleIds.includes(rule.id)}
                  onChange={() => toggleRule(rule.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                />
                <span>
                  <span className="font-medium text-slate-900">{rule.name}</span>
                  <span className="ml-2 text-xs text-slate-500">{rule.severity}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <label className="block rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-medium uppercase tracking-normal text-slate-500">
              Sheet number regex
            </span>
            <input
              value={config.sheetPattern}
              onChange={(event) =>
                onChange({ ...config, sheetPattern: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
            />
            {patternError ? (
              <p className="mt-2 text-xs text-amber-700">{patternError}</p>
            ) : null}
          </label>

          <label className="block rounded-md border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs font-medium uppercase tracking-normal text-slate-500">
              Placeholder values
            </span>
            <textarea
              value={placeholderText}
              onChange={(event) => setPlaceholderText(event.target.value)}
              onBlur={() =>
                onChange({
                  ...config,
                  placeholders: parsePlaceholderInput(placeholderText),
                })
              }
              rows={3}
              className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-300"
            />
            <p className="mt-2 text-xs text-slate-500">
              Comma-separated. Leave empty to restore the defaults.
            </p>
          </label>
        </div>
      </div>
    </section>
  );
}

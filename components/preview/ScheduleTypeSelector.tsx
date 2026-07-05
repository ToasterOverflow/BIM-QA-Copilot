"use client";

import type { ScheduleType } from "@/types/schedule";
import { formatScheduleType } from "@/lib/utils/strings";

const scheduleTypes: ScheduleType[] = [
  "sheet-list",
  "room-schedule",
  "door-schedule",
  "view-list",
  "generic",
];

interface ScheduleTypeSelectorProps {
  value: ScheduleType;
  suggested: ScheduleType;
  onChange(type: ScheduleType): void;
}

export function ScheduleTypeSelector({
  value,
  suggested,
  onChange,
}: ScheduleTypeSelectorProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-100 p-4">
      <h2 className="text-sm font-semibold text-slate-950">Schedule type</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {scheduleTypes.map((type) => {
          const active = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${
                active
                  ? "border-slate-900 bg-slate-900 text-slate-50"
                  : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {formatScheduleType(type)}
              {type === suggested ? (
                <span
                  className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] ${
                    active ? "bg-slate-700 text-slate-100" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  suggested
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

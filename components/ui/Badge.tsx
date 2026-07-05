import type { ReactNode } from "react";
import type { Severity } from "@/types/issue";

interface BadgeProps {
  severity: Severity;
  children: ReactNode;
}

const severityClasses: Record<Severity, string> = {
  critical: "bg-red-50 text-red-700 ring-red-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  info: "bg-blue-50 text-blue-700 ring-blue-100",
};

export function Badge({ severity, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${severityClasses[severity]}`}
    >
      {children}
    </span>
  );
}

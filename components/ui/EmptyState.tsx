import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-slate-100/60 px-6 py-12 text-center">
      {icon ? <div className="mb-4 flex justify-center text-slate-500">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-prose text-sm text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}

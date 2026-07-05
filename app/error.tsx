"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-slate-100 p-6 text-center">
        <h1 className="text-lg font-semibold text-slate-950">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">
          Reload the QA workspace and try the last action again.
        </p>
        <Button className="mt-5" onClick={reset}>
          Reload
        </Button>
      </section>
    </main>
  );
}

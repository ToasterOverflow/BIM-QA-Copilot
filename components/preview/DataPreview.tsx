"use client";

import { useState } from "react";
import type { ParsedCsv } from "@/types/schedule";
import { isBlank } from "@/lib/utils/placeholders";

interface DataPreviewProps {
  parsed: ParsedCsv;
}

export function DataPreview({ parsed }: DataPreviewProps) {
  const [showAllWarnings, setShowAllWarnings] = useState(false);
  const visibleRows = parsed.rows.slice(0, 50);
  const visibleWarnings = showAllWarnings
    ? parsed.warnings
    : parsed.warnings.slice(0, 3);

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-100 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Data preview</h2>
          <p className="text-sm text-slate-600">
            {parsed.fileName} - {parsed.rowCount} rows - {parsed.headers.length} columns
          </p>
        </div>
        {parsed.rowCount > visibleRows.length ? (
          <p className="text-xs text-slate-500">
            Showing {visibleRows.length} of {parsed.rowCount} rows
          </p>
        ) : null}
      </div>

      {parsed.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">
            {parsed.warnings.length} parsing warning
            {parsed.warnings.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 space-y-1">
            {visibleWarnings.map((warning, index) => (
              <li key={`${warning.row ?? "file"}-${index}`}>
                {warning.row ? `Row ${warning.row}: ` : ""}
                {warning.message}
              </li>
            ))}
          </ul>
          {parsed.warnings.length > 3 ? (
            <button
              type="button"
              onClick={() => setShowAllWarnings((current) => !current)}
              className="mt-2 text-xs font-medium underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              {showAllWarnings ? "Show fewer warnings" : "Show all warnings"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 max-h-[32rem] overflow-auto rounded-md border border-slate-200 bg-slate-50">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 bg-slate-200 text-xs uppercase tracking-normal text-slate-600">
            <tr>
              <th className="border-b border-slate-300 px-3 py-2 font-semibold">Row</th>
              {parsed.headers.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="whitespace-nowrap border-b border-slate-300 px-3 py-2 font-semibold"
                >
                  {header || `Column ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-200 last:border-0">
                <td className="px-3 py-2 text-slate-500">{rowIndex + 1}</td>
                {parsed.headers.map((header, columnIndex) => {
                  const value = row[header];
                  return (
                    <td
                      key={`${header}-${columnIndex}`}
                      className="max-w-64 truncate px-3 py-2"
                      title={value}
                    >
                      {isBlank(value) ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

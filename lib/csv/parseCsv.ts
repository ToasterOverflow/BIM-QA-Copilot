import Papa from "papaparse";
import type { CsvParseWarning, ParsedCsv, ScheduleRow } from "@/types/schedule";

function dedupeHeaders(rawHeaders: string[]): {
  headers: string[];
  warnings: CsvParseWarning[];
} {
  const counts = new Map<string, number>();
  const warnings: CsvParseWarning[] = [];

  const headers = rawHeaders.map((rawHeader, index) => {
    const trimmed =
      index === 0 ? rawHeader.replace(/^\uFEFF/, "").trim() : rawHeader.trim();
    const count = (counts.get(trimmed) ?? 0) + 1;
    counts.set(trimmed, count);

    if (count === 1) {
      return trimmed;
    }

    const deduped = `${trimmed} (${count})`;
    warnings.push({
      row: null,
      message: `Duplicate header "${trimmed}" renamed to "${deduped}"`,
    });
    return deduped;
  });

  return { headers, warnings };
}

export function parseCsv(csvText: string, fileName: string): ParsedCsv {
  const result = Papa.parse<string[]>(csvText, {
    delimiter: "",
    dynamicTyping: false,
    skipEmptyLines: "greedy",
  });

  if (result.data.length === 0) {
    throw new Error("File contains no data");
  }

  const [rawHeaderRow, ...dataRows] = result.data;
  if (!rawHeaderRow || rawHeaderRow.length === 0) {
    throw new Error("File contains no data");
  }

  const { headers, warnings } = dedupeHeaders(rawHeaderRow.map(String));

  for (const error of result.errors) {
    warnings.push({
      row: typeof error.row === "number" ? Math.max(error.row, 0) : null,
      message: error.message,
    });
  }

  const rows: ScheduleRow[] = dataRows.map((rawRow, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const row: ScheduleRow = {};

    if (rawRow.length < headers.length) {
      warnings.push({
        row: rowNumber,
        message: `Row has ${rawRow.length} of ${headers.length} columns; missing values treated as blank`,
      });
    }

    if (rawRow.length > headers.length) {
      warnings.push({
        row: rowNumber,
        message: `Row has ${rawRow.length} of ${headers.length} columns; extra values ignored`,
      });
    }

    for (let columnIndex = 0; columnIndex < headers.length; columnIndex += 1) {
      row[headers[columnIndex]] = String(rawRow[columnIndex] ?? "").trim();
    }

    return row;
  });

  return {
    fileName,
    headers,
    rows,
    warnings,
    rowCount: rows.length,
  };
}

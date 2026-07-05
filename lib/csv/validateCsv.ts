import type { CsvParseWarning, ParsedCsv } from "@/types/schedule";
import { isBlank } from "@/lib/utils/placeholders";

export function validateCsv(parsed: ParsedCsv): CsvParseWarning[] {
  const warnings: CsvParseWarning[] = [];

  if (parsed.rowCount === 0) {
    warnings.push({
      row: null,
      message: "File has headers but no data rows",
    });
  }

  if (parsed.rowCount > 5000) {
    warnings.push({
      row: null,
      message: `Large file (${parsed.rowCount} rows) - analysis may be slow`,
    });
  }

  parsed.headers.forEach((header, index) => {
    if (isBlank(header)) {
      warnings.push({
        row: null,
        message: `Column ${index + 1} has no header`,
      });
    }
  });

  return warnings;
}

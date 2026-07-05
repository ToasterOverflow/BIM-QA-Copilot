import { describe, expect, it } from "vitest";
import { detectColumns, suggestScheduleType } from "@/lib/csv/detectColumns";
import { parseCsv } from "@/lib/csv/parseCsv";
import { validateCsv } from "@/lib/csv/validateCsv";
import { SAMPLE_DATASETS } from "@/lib/sample-data";
import { isBlank, isPlaceholder } from "@/lib/utils/placeholders";

describe("shared utilities", () => {
  it("detects placeholders and blank values", () => {
    expect(isPlaceholder("TBD")).toBe(true);
    expect(isPlaceholder(" tbd ")).toBe(true);
    expect(isPlaceholder("table")).toBe(false);
    expect(isBlank("  ")).toBe(true);
  });
});

describe("parseCsv", () => {
  it("parses a simple CSV and preserves leading zeros", () => {
    const parsed = parseCsv("Number,Name\n0101,Lobby", "rooms.csv");

    expect(parsed.headers).toEqual(["Number", "Name"]);
    expect(parsed.rows[0].Number).toBe("0101");
    expect(parsed.rowCount).toBe(1);
  });

  it("handles quoted commas and escaped quotes", () => {
    const parsed = parseCsv(
      'Number,Name\nA-401,"Details, Sections & Callouts"\nA-402,"Door ""A"" Detail"',
      "sheets.csv",
    );

    expect(parsed.rows[0].Name).toBe("Details, Sections & Callouts");
    expect(parsed.rows[1].Name).toBe('Door "A" Detail');
  });

  it("strips BOM and handles CRLF", () => {
    const parsed = parseCsv("\uFEFFNumber,Name\r\n101,Lobby\r\n", "bom.csv");

    expect(parsed.headers[0]).toBe("Number");
    expect(parsed.rows[0].Name).toBe("Lobby");
  });

  it("fills short rows and warns", () => {
    const parsed = parseCsv("A,B,C\n1,2", "short.csv");

    expect(parsed.rows[0].C).toBe("");
    expect(parsed.warnings[0].message).toContain("missing values");
  });

  it("drops extra cells and warns", () => {
    const parsed = parseCsv("A,B\n1,2,3", "long.csv");

    expect(parsed.rows[0]).toEqual({ A: "1", B: "2" });
    expect(parsed.warnings[0].message).toContain("extra values");
  });

  it("dedupes duplicate headers and warns", () => {
    const parsed = parseCsv("Number,Number\n101,102", "duplicate.csv");

    expect(parsed.headers).toEqual(["Number", "Number (2)"]);
    expect(parsed.rows[0]["Number (2)"]).toBe("102");
    expect(parsed.warnings[0].message).toContain("Duplicate header");
  });

  it("throws for an empty file", () => {
    expect(() => parseCsv("", "empty.csv")).toThrow("File contains no data");
  });

  it("validates header-only and large files", () => {
    const headerOnly = parseCsv("A,B", "header-only.csv");
    expect(validateCsv(headerOnly)[0].message).toContain("no data rows");

    const manyRows = parseCsv(
      `A,B\n${Array.from({ length: 5001 }, (_, i) => `${i},x`).join("\n")}`,
      "large.csv",
    );
    expect(validateCsv(manyRows)[0].message).toContain("Large file");
  });

  it("auto-detects TSV", () => {
    const parsed = parseCsv("Number\tName\n101\tLobby", "rooms.tsv");
    expect(parsed.headers).toEqual(["Number", "Name"]);
    expect(parsed.rows[0].Name).toBe("Lobby");
  });
});

describe("column detection", () => {
  it("suggests the expected type for sample datasets", () => {
    for (const sample of SAMPLE_DATASETS) {
      const parsed = parseCsv(sample.csv, `${sample.label}.csv`);
      expect(suggestScheduleType(parsed.headers)).toBe(sample.scheduleType);
    }
  });

  it("suggests a sheet list when Sheet Number is paired with bare Name", () => {
    expect(suggestScheduleType(["Sheet Number", "Name"])).toBe("sheet-list");
    expect(suggestScheduleType(["View Name", "Sheet Number"])).toBe("view-list");
  });

  it("falls back to generic for unrecognized headers", () => {
    expect(suggestScheduleType(["Alpha", "Beta"])).toBe("generic");
  });

  it("detects door room context columns", () => {
    const columns = detectColumns(
      ["Mark", "To Room", "Fire Rating"],
      "door-schedule",
    );
    expect(columns.roomNumber).toBe("To Room");
  });
});

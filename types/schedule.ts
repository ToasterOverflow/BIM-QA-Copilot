export type ScheduleType =
  | "sheet-list"
  | "room-schedule"
  | "door-schedule"
  | "view-list"
  | "generic";

export type ScheduleRow = Record<string, string>;

export interface CsvParseWarning {
  row: number | null;
  message: string;
}

export interface ParsedCsv {
  fileName: string;
  headers: string[];
  rows: ScheduleRow[];
  warnings: CsvParseWarning[];
  rowCount: number;
}

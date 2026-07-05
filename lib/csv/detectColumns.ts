import type { ColumnMap } from "@/lib/rules/types";
import type { ScheduleType } from "@/types/schedule";
import { normalizeHeader } from "@/lib/utils/strings";

const BASE_SYNONYMS = {
  sheetNumber: ["sheetnumber", "sheetno", "sheet", "number"],
  sheetName: ["sheetname", "sheettitle", "title", "name"],
  roomNumber: ["roomnumber", "roomno", "number"],
  roomName: ["roomname", "name"],
  level: ["level", "floor", "storey", "story"],
  department: ["department", "dept"],
  doorNumber: ["doornumber", "doormark", "doorno", "mark", "number"],
  fireRating: ["firerating", "rating", "fire"],
  viewName: ["viewname", "view", "name"],
  viewSheet: ["sheetnumber", "sheetno", "sheet"],
} as const;

const FIELDS_BY_TYPE: Record<ScheduleType, string[]> = {
  "sheet-list": ["sheetNumber", "sheetName"],
  "room-schedule": ["roomNumber", "roomName", "level", "department"],
  "door-schedule": ["doorNumber", "roomNumber", "fireRating"],
  "view-list": ["viewName", "viewSheet"],
  generic: [],
};

function synonymsFor(field: string, scheduleType: ScheduleType): readonly string[] {
  if (field === "roomNumber" && scheduleType === "door-schedule") {
    return ["roomnumber", "toroom", "fromroom", "roomno", "room", "number"];
  }

  return BASE_SYNONYMS[field as keyof typeof BASE_SYNONYMS] ?? [];
}

function findHeader(
  headers: string[],
  field: string,
  scheduleType: ScheduleType,
): string | null {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  for (const synonym of synonymsFor(field, scheduleType)) {
    const match = normalizedHeaders.find(
      ({ normalized }) => normalized === synonym,
    );
    if (match) {
      return match.original;
    }
  }

  return null;
}

export function detectColumns(
  headers: string[],
  scheduleType: ScheduleType,
): ColumnMap {
  const fields = FIELDS_BY_TYPE[scheduleType] ?? [];
  const entries = fields.map((field) => [
    field,
    findHeader(headers, field, scheduleType),
  ]);

  return Object.fromEntries(entries);
}

export function suggestScheduleType(headers: string[]): ScheduleType {
  const normalizedHeaders = headers.map(normalizeHeader);
  const doorColumns = detectColumns(headers, "door-schedule");
  const hasDoorSpecificNumber = normalizedHeaders.some((header) =>
    ["doornumber", "doormark", "doorno", "mark"].includes(header),
  );
  if (hasDoorSpecificNumber || doorColumns.fireRating) {
    return "door-schedule";
  }

  const roomColumns = detectColumns(headers, "room-schedule");
  if (roomColumns.roomNumber || (roomColumns.roomName && roomColumns.level)) {
    return "room-schedule";
  }

  const sheetColumns = detectColumns(headers, "sheet-list");
  if (sheetColumns.sheetNumber && sheetColumns.sheetName) {
    return "sheet-list";
  }

  const viewColumns = detectColumns(headers, "view-list");
  if (viewColumns.viewName) {
    return "view-list";
  }

  return "generic";
}

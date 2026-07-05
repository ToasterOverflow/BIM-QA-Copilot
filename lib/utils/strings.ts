export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function formatScheduleType(type: string): string {
  const labels: Record<string, string> = {
    "sheet-list": "Sheet List",
    "room-schedule": "Room Schedule",
    "door-schedule": "Door Schedule",
    "view-list": "View List",
    generic: "Generic Schedule",
  };

  return labels[type] ?? type;
}

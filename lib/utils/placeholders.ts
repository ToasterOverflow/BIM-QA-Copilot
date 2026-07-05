export const PLACEHOLDER_VALUES = [
  "tbd",
  "n/a",
  "na",
  "untitled",
  "todo",
  "xxx",
  "-",
  "--",
  "?",
  "temp",
  "placeholder",
] as const;

export function isPlaceholder(
  value: string,
  placeholders: readonly string[] = PLACEHOLDER_VALUES,
): boolean {
  const normalizedValue = value.trim().toLowerCase();
  return placeholders.some(
    (placeholder) => placeholder.trim().toLowerCase() === normalizedValue,
  );
}

export function isBlank(value: string | undefined | null): boolean {
  return value === undefined || value === null || value.trim() === "";
}

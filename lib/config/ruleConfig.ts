import { PLACEHOLDER_VALUES } from "@/lib/utils/placeholders";

export const DEFAULT_SHEET_PATTERN =
  "^[A-Za-z]{1,3}[-.]?\\d{1,4}(\\.\\d{1,3})?$";

export interface RuleConfig {
  disabledRuleIds: string[];
  sheetPattern: string;
  placeholders: string[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const RULE_CONFIG_STORAGE_KEY = "bim-qa-copilot-rule-config";

export const DEFAULT_CONFIG: RuleConfig = {
  disabledRuleIds: [],
  sheetPattern: DEFAULT_SHEET_PATTERN,
  placeholders: [...PLACEHOLDER_VALUES],
};

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
}

export function normalizeConfig(value: unknown): RuleConfig {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_CONFIG, placeholders: [...DEFAULT_CONFIG.placeholders] };
  }

  const maybeConfig = value as Partial<RuleConfig>;
  return {
    disabledRuleIds: normalizeStringArray(maybeConfig.disabledRuleIds, []),
    sheetPattern:
      typeof maybeConfig.sheetPattern === "string" &&
      maybeConfig.sheetPattern.trim() !== ""
        ? maybeConfig.sheetPattern.trim()
        : DEFAULT_CONFIG.sheetPattern,
    placeholders: normalizeStringArray(
      maybeConfig.placeholders,
      DEFAULT_CONFIG.placeholders,
    ),
  };
}

function browserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

export function loadConfig(storage: StorageLike | null = browserStorage()): RuleConfig {
  if (!storage) {
    return normalizeConfig(null);
  }

  try {
    const raw = storage.getItem(RULE_CONFIG_STORAGE_KEY);
    return raw ? normalizeConfig(JSON.parse(raw)) : normalizeConfig(null);
  } catch {
    return normalizeConfig(null);
  }
}

export function saveConfig(
  config: RuleConfig,
  storage: StorageLike | null = browserStorage(),
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(RULE_CONFIG_STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
  } catch {
    // Storage can fail in private browsing or locked-down environments.
  }
}

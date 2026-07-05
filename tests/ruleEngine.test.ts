import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv/parseCsv";
import {
  DEFAULT_CONFIG,
  loadConfig,
  normalizeConfig,
  RULE_CONFIG_STORAGE_KEY,
  saveConfig,
} from "@/lib/config/ruleConfig";
import type { StorageLike } from "@/lib/config/ruleConfig";
import {
  findDuplicates,
  makeIssue,
  RULE_REGISTRY,
  runRules,
  sortIssues,
} from "@/lib/rules/ruleEngine";
import type { Rule } from "@/lib/rules/types";

describe("rule engine helpers", () => {
  it("builds stable issue ids", () => {
    const rule: Pick<Rule, "id" | "name" | "severity"> = {
      id: "test-rule",
      name: "Test rule",
      severity: "warning",
    };

    expect(makeIssue(rule, 2, "Name", "Bad", "Fix")).toMatchObject({
      id: "test-rule-2-Name",
      rowNumber: 2,
      column: "Name",
    });
  });

  it("finds duplicates case-insensitively and ignores blanks", () => {
    const rows = [{ Number: "A-101" }, { Number: "a-101 " }, { Number: "" }];
    expect(findDuplicates(rows, "Number").get("a-101")).toEqual([1, 2]);
    expect(findDuplicates(rows, "Number").has("")).toBe(false);
  });

  it("sorts by severity, row, then rule", () => {
    const rule: Pick<Rule, "id" | "name" | "severity"> = {
      id: "b-rule",
      name: "B",
      severity: "info",
    };
    const issues = [
      makeIssue(rule, 5, "Name", "Info", "Fix"),
      makeIssue({ ...rule, id: "a-rule", severity: "critical" }, null, "", "Critical", "Fix"),
      makeIssue({ ...rule, severity: "warning" }, 1, "Name", "Warning", "Fix"),
    ];

    expect(sortIssues(issues).map((issue) => issue.severity)).toEqual([
      "critical",
      "warning",
      "info",
    ]);
  });

  it("runs registered rules and records skipped rules", () => {
    const parsed = parseCsv("Number,Name\n101,Lobby\n101,", "rooms.csv");
    const result = runRules(parsed, "room-schedule");

    expect(result.issues.some((issue) => issue.ruleId === "room-duplicate-number")).toBe(true);
    expect(result.skippedRules).toContain("room-missing-department");
  });

  it("records disabled rules without marking them skipped", () => {
    const parsed = parseCsv("Number,Name\n101,Lobby\n101,", "rooms.csv");
    const result = runRules(parsed, "room-schedule", {
      ...DEFAULT_CONFIG,
      disabledRuleIds: ["room-duplicate-number"],
    });

    expect(result.disabledRules).toContain("room-duplicate-number");
    expect(result.skippedRules).not.toContain("room-duplicate-number");
    expect(result.issues.some((issue) => issue.ruleId === "room-duplicate-number")).toBe(false);
  });

  it("records throwing rules as failed, not skipped", () => {
    const originalRules = [...RULE_REGISTRY.generic];
    RULE_REGISTRY.generic = [
      {
        id: "throwing-rule",
        name: "Throwing rule",
        severity: "warning",
        scheduleType: "generic",
        check: () => {
          throw new Error("boom");
        },
      },
    ];

    try {
      const result = runRules(parseCsv("A\n1", "generic.csv"), "generic");
      expect(result.failedRules).toContain("throwing-rule");
      expect(result.skippedRules).not.toContain("throwing-rule");
    } finally {
      RULE_REGISTRY.generic = originalRules;
    }
  });

  it("has the expected registry sizes", () => {
    expect(RULE_REGISTRY["sheet-list"]).toHaveLength(5);
    expect(RULE_REGISTRY["room-schedule"]).toHaveLength(6);
    expect(RULE_REGISTRY["door-schedule"]).toHaveLength(5);
    expect(RULE_REGISTRY["view-list"]).toHaveLength(5);
    expect(RULE_REGISTRY.generic).toHaveLength(4);
  });
});

describe("rule config persistence", () => {
  function fakeStorage(initial: Record<string, string> = {}): StorageLike {
    const store = { ...initial };
    return {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = value;
      },
    };
  }

  it("normalizes malformed config and falls back when storage is absent or corrupt", () => {
    expect(loadConfig(null)).toEqual(DEFAULT_CONFIG);
    expect(loadConfig(fakeStorage({ [RULE_CONFIG_STORAGE_KEY]: "{bad json" }))).toEqual(DEFAULT_CONFIG);
    expect(normalizeConfig({ disabledRuleIds: ["a"], sheetPattern: "", placeholders: [] })).toEqual({
      disabledRuleIds: ["a"],
      sheetPattern: DEFAULT_CONFIG.sheetPattern,
      placeholders: DEFAULT_CONFIG.placeholders,
    });
  });

  it("saves and loads config through storage", () => {
    const storage = fakeStorage();
    const config = {
      disabledRuleIds: ["sheet-placeholder"],
      sheetPattern: "^[A-Z]{2}-\\d{3}$",
      placeholders: ["tbd", "hold"],
    };

    saveConfig(config, storage);
    expect(loadConfig(storage)).toEqual(config);
  });
});

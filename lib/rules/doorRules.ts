import {
  duplicateValueRule,
  missingValueRule,
  placeholderRule,
} from "./ruleFactories";
import type { Rule } from "./types";

export const doorRules: Rule[] = [
  missingValueRule({
    id: "door-missing-number",
    name: "Missing door number",
    severity: "critical",
    scheduleType: "door-schedule",
    field: "doorNumber",
    label: "Door number",
    fileLevelWhenColumnAbsent: true,
  }),
  duplicateValueRule({
    id: "door-duplicate-number",
    name: "Duplicate door number",
    scheduleType: "door-schedule",
    field: "doorNumber",
    label: "Door number",
  }),
  missingValueRule({
    id: "door-missing-room",
    name: "Missing associated room",
    severity: "warning",
    scheduleType: "door-schedule",
    field: "roomNumber",
    label: "Associated room",
    fileLevelWhenColumnAbsent: false,
  }),
  missingValueRule({
    id: "door-missing-fire-rating",
    name: "Missing fire rating",
    severity: "warning",
    scheduleType: "door-schedule",
    field: "fireRating",
    label: "Fire rating",
    fileLevelWhenColumnAbsent: false,
  }),
  placeholderRule({ id: "door-placeholder", scheduleType: "door-schedule" }),
];

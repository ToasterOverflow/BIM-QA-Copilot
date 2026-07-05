import {
  duplicateValueRule,
  missingValueRule,
  placeholderRule,
} from "./ruleFactories";
import type { Rule } from "./types";

export const roomRules: Rule[] = [
  missingValueRule({
    id: "room-missing-number",
    name: "Missing room number",
    severity: "critical",
    scheduleType: "room-schedule",
    field: "roomNumber",
    label: "Room number",
    fileLevelWhenColumnAbsent: true,
  }),
  missingValueRule({
    id: "room-missing-name",
    name: "Missing room name",
    severity: "critical",
    scheduleType: "room-schedule",
    field: "roomName",
    label: "Room name",
    fileLevelWhenColumnAbsent: true,
  }),
  duplicateValueRule({
    id: "room-duplicate-number",
    name: "Duplicate room number",
    scheduleType: "room-schedule",
    field: "roomNumber",
    label: "Room number",
  }),
  missingValueRule({
    id: "room-missing-level",
    name: "Missing level",
    severity: "warning",
    scheduleType: "room-schedule",
    field: "level",
    label: "Level",
    fileLevelWhenColumnAbsent: true,
    absentProblem: "No Level column found.",
  }),
  missingValueRule({
    id: "room-missing-department",
    name: "Missing department",
    severity: "info",
    scheduleType: "room-schedule",
    field: "department",
    label: "Department",
    fileLevelWhenColumnAbsent: false,
  }),
  placeholderRule({ id: "room-placeholder", scheduleType: "room-schedule" }),
];

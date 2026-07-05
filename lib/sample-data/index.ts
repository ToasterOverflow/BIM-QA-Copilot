import type { ScheduleType } from "@/types/schedule";
import { sampleDoorSchedule } from "./sampleDoorSchedule";
import { sampleRoomSchedule } from "./sampleRoomSchedule";
import { sampleSheetList } from "./sampleSheetList";
import { sampleViewList } from "./sampleViewList";

export interface SampleDataset {
  id: string;
  label: string;
  scheduleType: ScheduleType;
  csv: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "sheet-list",
    label: "Sample Sheet List",
    scheduleType: "sheet-list",
    csv: sampleSheetList,
  },
  {
    id: "room-schedule",
    label: "Sample Room Schedule",
    scheduleType: "room-schedule",
    csv: sampleRoomSchedule,
  },
  {
    id: "door-schedule",
    label: "Sample Door Schedule",
    scheduleType: "door-schedule",
    csv: sampleDoorSchedule,
  },
  {
    id: "view-list",
    label: "Sample View List",
    scheduleType: "view-list",
    csv: sampleViewList,
  },
];

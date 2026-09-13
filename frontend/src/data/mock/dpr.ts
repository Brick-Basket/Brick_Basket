import type { DPR, DPRManpowerEntry, DPRWorkItemEntry } from "@/types/domain/dpr";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/dpr-adapter.ts. Four DPRs across both projects that
 * have Part 13 `ScheduleActivity` data, two of them (`dpr_1`–`dpr_3`'s
 * `civil_13` line, `dpr_4`'s `civil_9` line) linked to a real
 * `ScheduleActivity` (`sched_3`, `sched_11`) so the "linked to Schedule"
 * indicator has something real to show.
 *
 * Seed data does **not** retroactively create `ScheduleProgressEntry`
 * records — that side effect only fires inside `DPRAdapter.create`/
 * `update` for a DPR actually submitted at runtime (see
 * `dpr-adapter.ts`'s header comment). Submit a new DPR from the UI,
 * linking a work item to a `ScheduleActivity`, to see the live wiring.
 */
export const mockDPRs: DPR[] = [
  {
    id: "dpr_1",
    projectId: "proj_modern_residence",
    dprNumber: "DPR-0001",
    reportDate: "2026-09-09",
    preparedBy: "u_engineer",
    preparedByName: "Sana Iqbal",
    notes: "Brickwork crew back at full strength after being pulled to another site; conduit rough-in started on the ground floor.",
    createdAt: "2026-09-09T18:00:00.000Z",
    updatedAt: "2026-09-09T18:00:00.000Z",
  },
  {
    id: "dpr_2",
    projectId: "proj_modern_residence",
    dprNumber: "DPR-0002",
    reportDate: "2026-09-10",
    preparedBy: "u_pm",
    preparedByName: "Karan Mehta",
    createdAt: "2026-09-10T18:15:00.000Z",
    updatedAt: "2026-09-10T18:15:00.000Z",
  },
  {
    id: "dpr_3",
    projectId: "proj_modern_residence",
    dprNumber: "DPR-0003",
    reportDate: "2026-09-11",
    preparedBy: "u_engineer",
    preparedByName: "Sana Iqbal",
    notes: "Cold-water rough-in started on the ground floor.",
    createdAt: "2026-09-11T18:05:00.000Z",
    updatedAt: "2026-09-11T18:05:00.000Z",
  },
  {
    id: "dpr_4",
    projectId: "proj_luxury_villa",
    dprNumber: "DPR-0004",
    reportDate: "2026-09-10",
    preparedBy: "u_pm",
    preparedByName: "Karan Mehta",
    notes: "Superstructure columns progressing; interior finishing procurement still pending drawings.",
    createdAt: "2026-09-10T17:40:00.000Z",
    updatedAt: "2026-09-10T17:40:00.000Z",
  },
];

export const mockDPRManpowerEntries: DPRManpowerEntry[] = [
  // dpr_1
  { id: "dpr_mp_1", dprId: "dpr_1", category: "civil_mason", skilled: 6, unskilled: 10, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-09T18:00:00.000Z" },
  { id: "dpr_mp_2", dprId: "dpr_1", category: "carpenter", skilled: 2, unskilled: 3, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-09T18:00:00.000Z" },
  { id: "dpr_mp_3", dprId: "dpr_1", category: "bar_bender", skilled: 1, unskilled: 1, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-09T18:00:00.000Z" },
  { id: "dpr_mp_4", dprId: "dpr_1", category: "plumber", skilled: 0, unskilled: 0, createdAt: "2026-09-09T18:00:00.000Z" },
  { id: "dpr_mp_5", dprId: "dpr_1", category: "electrician", skilled: 2, unskilled: 2, agency: "Volt Line Electricals", createdAt: "2026-09-09T18:00:00.000Z" },
  { id: "dpr_mp_6", dprId: "dpr_1", category: "painter", skilled: 0, unskilled: 0, createdAt: "2026-09-09T18:00:00.000Z" },
  { id: "dpr_mp_7", dprId: "dpr_1", category: "tile_masonry_finishing", skilled: 0, unskilled: 0, createdAt: "2026-09-09T18:00:00.000Z" },
  { id: "dpr_mp_8", dprId: "dpr_1", category: "other", skilled: 0, unskilled: 3, agency: "Site housekeeping", createdAt: "2026-09-09T18:00:00.000Z" },

  // dpr_2
  { id: "dpr_mp_9", dprId: "dpr_2", category: "civil_mason", skilled: 7, unskilled: 9, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-10T18:15:00.000Z" },
  { id: "dpr_mp_10", dprId: "dpr_2", category: "carpenter", skilled: 2, unskilled: 2, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-10T18:15:00.000Z" },
  { id: "dpr_mp_11", dprId: "dpr_2", category: "bar_bender", skilled: 1, unskilled: 2, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-10T18:15:00.000Z" },
  { id: "dpr_mp_12", dprId: "dpr_2", category: "plumber", skilled: 0, unskilled: 0, createdAt: "2026-09-10T18:15:00.000Z" },
  { id: "dpr_mp_13", dprId: "dpr_2", category: "electrician", skilled: 2, unskilled: 3, agency: "Volt Line Electricals", createdAt: "2026-09-10T18:15:00.000Z" },
  { id: "dpr_mp_14", dprId: "dpr_2", category: "painter", skilled: 0, unskilled: 0, createdAt: "2026-09-10T18:15:00.000Z" },
  { id: "dpr_mp_15", dprId: "dpr_2", category: "tile_masonry_finishing", skilled: 0, unskilled: 0, createdAt: "2026-09-10T18:15:00.000Z" },
  { id: "dpr_mp_16", dprId: "dpr_2", category: "other", skilled: 0, unskilled: 2, agency: "Site housekeeping", createdAt: "2026-09-10T18:15:00.000Z" },

  // dpr_3
  { id: "dpr_mp_17", dprId: "dpr_3", category: "civil_mason", skilled: 7, unskilled: 9, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-11T18:05:00.000Z" },
  { id: "dpr_mp_18", dprId: "dpr_3", category: "carpenter", skilled: 2, unskilled: 2, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-11T18:05:00.000Z" },
  { id: "dpr_mp_19", dprId: "dpr_3", category: "bar_bender", skilled: 1, unskilled: 1, agency: "Shree Balaji Labour Contractors", createdAt: "2026-09-11T18:05:00.000Z" },
  { id: "dpr_mp_20", dprId: "dpr_3", category: "plumber", skilled: 1, unskilled: 1, agency: "AquaFlow Plumbing Services", createdAt: "2026-09-11T18:05:00.000Z" },
  { id: "dpr_mp_21", dprId: "dpr_3", category: "electrician", skilled: 2, unskilled: 2, agency: "Volt Line Electricals", createdAt: "2026-09-11T18:05:00.000Z" },
  { id: "dpr_mp_22", dprId: "dpr_3", category: "painter", skilled: 0, unskilled: 0, createdAt: "2026-09-11T18:05:00.000Z" },
  { id: "dpr_mp_23", dprId: "dpr_3", category: "tile_masonry_finishing", skilled: 0, unskilled: 0, createdAt: "2026-09-11T18:05:00.000Z" },
  { id: "dpr_mp_24", dprId: "dpr_3", category: "other", skilled: 0, unskilled: 2, agency: "Site housekeeping", createdAt: "2026-09-11T18:05:00.000Z" },

  // dpr_4
  { id: "dpr_mp_25", dprId: "dpr_4", category: "civil_mason", skilled: 4, unskilled: 6, agency: "Vadodara Civil Crew", createdAt: "2026-09-10T17:40:00.000Z" },
  { id: "dpr_mp_26", dprId: "dpr_4", category: "carpenter", skilled: 3, unskilled: 3, agency: "Vadodara Civil Crew", createdAt: "2026-09-10T17:40:00.000Z" },
  { id: "dpr_mp_27", dprId: "dpr_4", category: "bar_bender", skilled: 2, unskilled: 2, agency: "Vadodara Civil Crew", createdAt: "2026-09-10T17:40:00.000Z" },
  { id: "dpr_mp_28", dprId: "dpr_4", category: "plumber", skilled: 0, unskilled: 0, createdAt: "2026-09-10T17:40:00.000Z" },
  { id: "dpr_mp_29", dprId: "dpr_4", category: "electrician", skilled: 0, unskilled: 0, createdAt: "2026-09-10T17:40:00.000Z" },
  { id: "dpr_mp_30", dprId: "dpr_4", category: "painter", skilled: 0, unskilled: 0, createdAt: "2026-09-10T17:40:00.000Z" },
  { id: "dpr_mp_31", dprId: "dpr_4", category: "tile_masonry_finishing", skilled: 0, unskilled: 0, createdAt: "2026-09-10T17:40:00.000Z" },
  { id: "dpr_mp_32", dprId: "dpr_4", category: "other", skilled: 0, unskilled: 1, agency: "Site housekeeping", createdAt: "2026-09-10T17:40:00.000Z" },
];

export const mockDPRWorkItemEntries: DPRWorkItemEntry[] = [
  // dpr_1 — 2026-09-09
  {
    id: "dpr_wi_1",
    dprId: "dpr_1",
    workItemMasterId: "civil_13",
    location: "Ground Floor – East Wing",
    plannedQty: 500,
    todayQty: 38,
    remarks: "Resumed after a two-week gap while the mason crew was pulled to another site.",
    scheduleActivityId: "sched_3",
    createdAt: "2026-09-09T18:00:00.000Z",
  },
  {
    id: "dpr_wi_2",
    dprId: "dpr_1",
    workItemMasterId: "electrical_1",
    location: "Ground Floor",
    plannedQty: 800,
    todayQty: 55,
    remarks: "Lighting circuit conduit.",
    createdAt: "2026-09-09T18:00:00.000Z",
  },

  // dpr_2 — 2026-09-10
  {
    id: "dpr_wi_3",
    dprId: "dpr_2",
    workItemMasterId: "civil_13",
    location: "Ground Floor – East Wing",
    plannedQty: 500,
    todayQty: 42,
    scheduleActivityId: "sched_3",
    createdAt: "2026-09-10T18:15:00.000Z",
  },
  {
    id: "dpr_wi_4",
    dprId: "dpr_2",
    workItemMasterId: "electrical_1",
    location: "Ground Floor",
    plannedQty: 800,
    todayQty: 65,
    createdAt: "2026-09-10T18:15:00.000Z",
  },
  {
    id: "dpr_wi_5",
    dprId: "dpr_2",
    workItemMasterId: "civil_19",
    location: "Ground Floor – East Wing",
    plannedQty: 300,
    todayQty: 10,
    createdAt: "2026-09-10T18:15:00.000Z",
  },

  // dpr_3 — 2026-09-11
  {
    id: "dpr_wi_6",
    dprId: "dpr_3",
    workItemMasterId: "civil_13",
    location: "Ground Floor – East Wing",
    plannedQty: 500,
    todayQty: 30,
    remarks: "On pace to close out brickwork by mid-September.",
    scheduleActivityId: "sched_3",
    createdAt: "2026-09-11T18:05:00.000Z",
  },
  {
    id: "dpr_wi_7",
    dprId: "dpr_3",
    workItemMasterId: "civil_19",
    location: "Ground Floor – East Wing",
    plannedQty: 300,
    todayQty: 14,
    createdAt: "2026-09-11T18:05:00.000Z",
  },
  {
    id: "dpr_wi_8",
    dprId: "dpr_3",
    workItemMasterId: "plumbing_1",
    location: "Ground Floor",
    plannedQty: 260,
    todayQty: 20,
    remarks: "Cold-water rough-in started.",
    createdAt: "2026-09-11T18:05:00.000Z",
  },

  // dpr_4 — 2026-09-10, proj_luxury_villa
  {
    id: "dpr_wi_9",
    dprId: "dpr_4",
    workItemMasterId: "civil_9",
    location: "First Floor Columns",
    plannedQty: 300,
    todayQty: 18,
    remarks: "Column pours continuing per the superstructure schedule.",
    scheduleActivityId: "sched_11",
    createdAt: "2026-09-10T17:40:00.000Z",
  },
  {
    id: "dpr_wi_10",
    dprId: "dpr_4",
    workItemMasterId: "civil_7",
    location: "First Floor Columns",
    plannedQty: 25,
    todayQty: 1.5,
    createdAt: "2026-09-10T17:40:00.000Z",
  },
];

import type { ScheduleProgressEntry } from "@/types/domain/project-schedule";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/schedule-adapter.ts. Every entry is recorded by
 * `u_pm` (Karan Mehta, the demo `project_manager` persona — the only role
 * besides `admin` holding `schedule:write`, see `src/lib/auth/mock-users.ts`).
 * `executedQuantity` is cumulative-as-of `recordedAt`, not incremental —
 * the latest entry per `activityId` is always "current progress."
 */
export const mockScheduleProgress: ScheduleProgressEntry[] = [
  // sched_1 — Site Clearance & Layout (completed)
  { id: "prog_1", activityId: "sched_1", recordedAt: "2026-08-09", executedQuantity: 1, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-08-09T11:00:00.000Z" },

  // sched_2 — Excavation (completed, two entries)
  { id: "prog_2", activityId: "sched_2", recordedAt: "2026-08-15", executedQuantity: 200, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-08-15T11:00:00.000Z" },
  { id: "prog_3", activityId: "sched_2", recordedAt: "2026-08-24", executedQuantity: 420, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-08-24T11:00:00.000Z" },

  // sched_3 — Brickwork & Plastering, Ground Floor (overdue — planned end 2026-08-15, still incomplete)
  { id: "prog_4", activityId: "sched_3", recordedAt: "2026-07-20", executedQuantity: 200, recordedBy: "u_pm", recordedByName: "Karan Mehta", remarks: "On pace so far." , createdAt: "2026-07-20T11:00:00.000Z" },
  { id: "prog_5", activityId: "sched_3", recordedAt: "2026-08-10", executedQuantity: 300, recordedBy: "u_pm", recordedByName: "Karan Mehta", remarks: "Mason crew pulled to another site — slowing down.", createdAt: "2026-08-10T11:00:00.000Z" },
  { id: "prog_6", activityId: "sched_3", recordedAt: "2026-09-05", executedQuantity: 350, recordedBy: "u_pm", recordedByName: "Karan Mehta", remarks: "Crew back, but well past the planned finish date.", createdAt: "2026-09-05T11:00:00.000Z" },

  // sched_4 — Foundation & Footing (behind pace, not yet overdue — planned end 2026-09-15)
  { id: "prog_7", activityId: "sched_4", recordedAt: "2026-09-01", executedQuantity: 150, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-09-01T11:00:00.000Z" },
  { id: "prog_8", activityId: "sched_4", recordedAt: "2026-09-10", executedQuantity: 300, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-09-10T11:00:00.000Z" },

  // sched_5 — Electrical & Plumbing Rough-in (slightly ahead of pace)
  { id: "prog_9", activityId: "sched_5", recordedAt: "2026-09-10", executedQuantity: 0.3, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-09-10T11:00:00.000Z" },

  // sched_6 — Plinth Beam & DPC (slightly ahead of pace)
  { id: "prog_10", activityId: "sched_6", recordedAt: "2026-09-11", executedQuantity: 15, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-09-11T11:00:00.000Z" },

  // sched_7, sched_8 — not started, no entries yet

  // sched_9 — Design & Approvals (completed)
  { id: "prog_11", activityId: "sched_9", recordedAt: "2026-06-29", executedQuantity: 1, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-06-29T11:00:00.000Z" },

  // sched_10 — Foundation, Luxury Villa (completed)
  { id: "prog_12", activityId: "sched_10", recordedAt: "2026-07-24", executedQuantity: 150, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-07-24T11:00:00.000Z" },

  // sched_11 — Superstructure, Luxury Villa (behind pace, not yet overdue — planned end 2026-10-15)
  { id: "prog_13", activityId: "sched_11", recordedAt: "2026-08-20", executedQuantity: 80, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-08-20T11:00:00.000Z" },
  { id: "prog_14", activityId: "sched_11", recordedAt: "2026-09-05", executedQuantity: 150, recordedBy: "u_pm", recordedByName: "Karan Mehta", createdAt: "2026-09-05T11:00:00.000Z" },

  // sched_12, sched_13 — not started, no entries yet
];

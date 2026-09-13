/**
 * Project Schedule + Tracking (Part 13) — the owner-required
 * "Gantt/schedule-table hybrid" (activity, quantity, UOM, a dynamic date/
 * month range) plus schedule tracking, where a Project Manager updates
 * executed quantities over time with a pro-rata progress visualization and
 * a delay-in-days reflection when an activity isn't executed on time.
 *
 * Named `ScheduleActivity`/`ScheduleProgressEntry` here rather than the
 * prompt's literal `ProjectSchedule`/`ScheduleProgress` — `ScheduleActivity`
 * is one row of the schedule (what the prompt calls a "ProjectSchedule"
 * entry), and `ScheduleProgressEntry` is one dated, cumulative-quantity
 * update in that activity's tracking log (what the prompt calls
 * "ScheduleProgress").
 *
 * Source module: Project Schedule + Tracking (Part 13), scoped to a
 * `Project` by `projectId`. Dependent module: Daily Progress Report
 * (Part 14) is asked to wire DPR entries into this module's progress/delay
 * figures — not implemented yet, see `docs/PART_PROMPTS.md`.
 * Backend ownership: persistence, numbering, and the authoritative
 * progress/delay calculation are backend-owned once a real schedule engine
 * exists — everything below is computed client-side, never stored, and
 * flagged as a frontend decision where the owner requirements don't define
 * the exact formula (see `docs/OPEN_QUESTIONS.md`).
 */
/**
 * One month's slice of an activity's planned `quantity` — added in the
 * post-Part-20 stabilization pass (Phase 3), resolving the owner's "dynamic
 * date/month range" requirement's monthly-planning half (the Gantt's own
 * dynamic month header, Part 13, only ever covered the *display* range).
 * `month` is a "YYYY-MM" key, always within `[plannedStart, plannedEnd]`'s
 * own months (`getMonthKeysInRange`, `schedule-monthly-plan-math.ts`).
 */
export interface ScheduleMonthlyPlanEntry {
  /** "YYYY-MM" */
  month: string;
  plannedQuantity: number;
}

export interface ScheduleActivity {
  id: string;
  projectId: string;
  /** The work item name, e.g. "Excavation" or "Brickwork & Plastering — Ground Floor". */
  activity: string;
  uom: string;
  /** Planned total quantity for this activity. */
  quantity: number;
  /** ISO date (day precision) — the planned start of this activity. */
  plannedStart: string;
  /** ISO date (day precision) — the planned finish of this activity. */
  plannedEnd: string;
  /** Display/Gantt-row order within a project — lower first. Distinct from `createdAt`, since activities are usually entered out of chronological order. */
  sequence: number;
  /**
   * Optional monthly breakdown of `quantity` (Phase 3) — an empty array
   * means "not broken down by month yet," a state every pre-Phase-3
   * activity starts in and stays valid in forever; once any entry exists,
   * the entries must sum to `quantity` exactly (small floating-point
   * tolerance) — see `validateMonthlyPlan`. **FRONTEND IMPLEMENTATION
   * DECISION** — the owner requirements ask for a dynamic monthly
   * breakdown without confirming whether it's required for every activity;
   * this build makes it opt-in per activity rather than blocking every
   * existing/simple activity on filling one in. See `docs/OPEN_QUESTIONS.md`.
   */
  monthlyPlan: ScheduleMonthlyPlanEntry[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateScheduleActivityInput = {
  projectId: string;
  activity: string;
  uom: string;
  quantity: number;
  plannedStart: string;
  plannedEnd: string;
  /** Defaults to `(highest existing sequence for this project) + 1` when omitted. */
  sequence?: number;
  /** Defaults to `[]` ("not broken down by month") when omitted. */
  monthlyPlan?: ScheduleMonthlyPlanEntry[];
  notes?: string;
};

/** Fields the edit form may update — `projectId` is immutable after creation, matching every other module's project-scoped entity (`ACEItem`, `StockEntry`, e.g.). */
export type UpdateScheduleActivityInput = Partial<Omit<CreateScheduleActivityInput, "projectId">>;

/**
 * One dated, cumulative measurement of how much of an activity's `quantity`
 * has actually been executed — an append-only log, the same pattern
 * `VendorAssessment`/`LeadActivity` use, rather than a single mutable
 * "current progress" field on `ScheduleActivity` itself. `executedQuantity`
 * is cumulative-as-of `recordedAt`, not an incremental delta — the latest
 * entry by `recordedAt` is always what "current progress" means.
 *
 * `source` is a narrow, deliberate exception to "append-only" (post-Part-20
 * stabilization pass, Phase 4, resolving `docs/OPEN_QUESTIONS.md` #35e):
 * an entry pushed here *by another module* (DPR, Part 14, today — the only
 * one that pushes progress on another module's behalf) carries a stable
 * key identifying what produced it, so that module can find and correct
 * **its own** previously-pushed entry the next time its underlying data
 * changes, instead of appending a duplicate every time. An entry with no
 * `source` was typed in directly on this screen and stays append-only, as
 * before — see `ScheduleAdapter.upsertProgressFromSource`.
 */
export interface ScheduleProgressEntry {
  id: string;
  activityId: string;
  /** ISO date (day precision) — the date this cumulative figure is as-of. */
  recordedAt: string;
  executedQuantity: number;
  recordedBy: string;
  recordedByName: string;
  remarks?: string;
  createdAt: string;
  source?: {
    type: "dpr";
    /** Stable across edits to the same DPR line even though `DPRWorkItemEntry.id` itself is regenerated on every edit (see `dpr-adapter.ts`'s `update`) — built as `${dprId}:${workItemMasterId}:${location ?? ""}`. */
    key: string;
  };
}

export type CreateScheduleProgressInput = {
  recordedAt: string;
  executedQuantity: number;
  remarks?: string;
};

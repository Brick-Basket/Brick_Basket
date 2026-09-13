import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

/**
 * Computed-at-render-time progress/delay math for the Project Schedule
 * module (Part 13) — nothing here is ever persisted, matching every other
 * module's "derived values are computed, never stored" convention
 * (line amounts, closing stock, RFQ savings, e.g.).
 *
 * **FRONTEND IMPLEMENTATION DECISION — see `docs/OPEN_QUESTIONS.md` #34.**
 * The owner requirements name "pro-rata progress-to-green visualization"
 * and "delay-in-days reflection" without defining the exact formula. This
 * build computes:
 *   - "expected" progress as straight-line (pro-rata) time elapsed between
 *     `plannedStart` and `plannedEnd`, clamped to 0–100%;
 *   - "delay in days" as simply how many days past `plannedEnd` today is,
 *     while the activity is still short of 100% complete (0 once complete,
 *     0 before `plannedEnd`, whatever the actual pace).
 * A real implementation might instead project a finish date from the
 * activity's actual execution rate — that needs a confirmed formula.
 */

function parseISODate(value: string): Date {
  // Day-precision ISO dates ("2026-08-01") — parsed at local midnight so
  // date-only comparisons never drift a day from an implicit UTC offset.
  return new Date(`${value}T00:00:00`);
}

function daysBetween(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** The latest (by `recordedAt`) cumulative reading — "current progress" for this activity. `0` when nothing has been recorded yet. */
export function getExecutedQuantity(entries: ScheduleProgressEntry[]): number {
  if (entries.length === 0) return 0;
  const latest = entries.reduce((a, b) => (a.recordedAt >= b.recordedAt ? a : b));
  return latest.executedQuantity;
}

/** `executedQuantity / quantity`, clamped to 0–100. */
export function getPercentComplete(activity: ScheduleActivity, executedQuantity: number): number {
  if (activity.quantity <= 0) return 0;
  return Math.max(0, Math.min(100, (executedQuantity / activity.quantity) * 100));
}

/** Straight-line (pro-rata) expected progress between `plannedStart` and `plannedEnd`, as of `asOf` (defaults to now). */
export function getExpectedPercent(activity: ScheduleActivity, asOf: Date = new Date()): number {
  const start = parseISODate(activity.plannedStart);
  const end = parseISODate(activity.plannedEnd);
  const totalDays = daysBetween(start, end);
  if (totalDays <= 0) return asOf >= start ? 100 : 0;
  const elapsedDays = daysBetween(start, asOf);
  return Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
}

/** Days past `plannedEnd`, only while the activity isn't yet 100% complete — `0` otherwise (not overdue, or already finished). */
export function getDelayDays(activity: ScheduleActivity, percentComplete: number, asOf: Date = new Date()): number {
  if (percentComplete >= 100) return 0;
  const end = parseISODate(activity.plannedEnd);
  const overdueDays = daysBetween(end, asOf);
  return overdueDays > 0 ? overdueDays : 0;
}

export type ScheduleProgressState = "not_started" | "behind" | "on_track" | "overdue" | "completed";

/**
 * A single state discriminator driving the progress bar's color — green
 * ("on_track"/"completed"), amber ("behind" — short of pro-rata pace but
 * not yet overdue), red ("overdue"), or neutral ("not_started" — before
 * `plannedStart`, nothing due yet).
 */
export function getProgressState(activity: ScheduleActivity, percentComplete: number, asOf: Date = new Date()): ScheduleProgressState {
  if (percentComplete >= 100) return "completed";
  const start = parseISODate(activity.plannedStart);
  const end = parseISODate(activity.plannedEnd);
  if (asOf < start && percentComplete === 0) return "not_started";
  if (asOf > end) return "overdue";
  const expected = getExpectedPercent(activity, asOf);
  return percentComplete >= expected ? "on_track" : "behind";
}

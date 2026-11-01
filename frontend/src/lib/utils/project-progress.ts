import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

/**
 * Robust manual-progress-mapping pass (Customer Module follow-up — see
 * docs/OPEN_QUESTIONS.md and docs/CHANGELOG.md for the full writeup).
 *
 * The problem with `Project.progressPercentage` as shipped in the first
 * Customer Module pass: it was a bare number staff typed into a box, with
 * no basis, no audit trail, and no connection to any other data in the
 * app — two different staff members could read the same site differently,
 * the number could jump or go backwards with no record of why, and the
 * customer had no way to tell whether "42%" meant anything.
 *
 * This file is the computed half of the fix: it turns the Schedule module
 * (Part 13 — `ScheduleActivity`/`ScheduleProgressEntry`, already real,
 * already in use at `/admin/project-management/schedule`, already fed in
 * part by DPR via `upsertProgressFromSource`) into a project-wide
 * completion suggestion, instead of inventing a second, parallel
 * "construction stage" model that would need its own data entry. The
 * audit-trail half lives in `ProjectProgressLogEntry`
 * (`types/domain/project-progress-log.ts`) and `ProjectsAdapter.update`/
 * `listProgressLog`.
 *
 * FRONTEND IMPLEMENTATION DECISION — the weighting below uses each
 * activity's own planned duration (`plannedEnd - plannedStart`) as its
 * share of the overall project, not its cost. That's a deliberate,
 * flagged simplification: this app has no reliable per-activity cost
 * figure wired to a `ScheduleActivity` today (the BOQ module's rate items
 * aren't linked to schedule activities anywhere). Duration is a real,
 * already-present number that's a reasonable effort proxy — a
 * multi-month "Superstructure" activity should move the overall
 * percentage more than a one-week "Site Clearance" activity, and it does.
 * A cost-weighted ("earned value") version — linking each activity to a
 * BOQ rate so a ₹-heavy activity counts for more, the way real
 * construction billing S-curves work — is flagged in
 * docs/OPEN_QUESTIONS.md as a deliberate Tier 2 upgrade, not built here,
 * since it needs that BOQ↔Schedule link to exist first.
 */
export interface ScheduleProgressBreakdownRow {
  activityId: string;
  activity: string;
  uom: string;
  quantity: number;
  /** Latest cumulative `executedQuantity` recorded for this activity (0 if no progress entry exists yet). */
  executedQuantity: number;
  /** This activity's own completion, 0–100. */
  percentage: number;
  /** This activity's weight in the overall roll-up — its planned duration in days (minimum 1, so a same-day activity still counts). */
  weightDays: number;
}

export interface ScheduleBasedProgress {
  /** Duration-weighted overall completion, 0–100, rounded to the nearest whole point. */
  percentage: number;
  /** Latest `recordedAt` across every contributing progress entry, or `null` if no activity has a progress entry yet. */
  asOf: string | null;
  breakdown: ScheduleProgressBreakdownRow[];
}

/**
 * How many percentage points a manual edit may diverge from the
 * Schedule-computed suggestion (when one exists) before the UI requires a
 * short reason. Also applied to any decrease, regardless of size — a
 * project's completion moving backwards is unusual enough to always want
 * one line explaining why (rework, a corrected over-count, demolition).
 */
export const PROGRESS_OVERRIDE_REASON_THRESHOLD = 10;

function clampPercentage(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

/**
 * Reduces a project's Schedule activities + their progress logs to a
 * single duration-weighted completion figure. Returns `null` when the
 * project has no Schedule activities at all — the caller falls back to
 * pure manual entry in that case (today's original behavior, unchanged).
 *
 * `progressByActivityId` entries are expected newest-`recordedAt`-first,
 * exactly what `ScheduleAdapter.listProgress`/`listProgressForActivities`
 * already return — this function takes the first entry per activity as
 * "current progress" rather than re-sorting, matching every other
 * Schedule-module consumer's assumption.
 */
export function computeScheduleBasedProgress(
  activities: ScheduleActivity[],
  progressByActivityId: Map<string, ScheduleProgressEntry[]>,
): ScheduleBasedProgress | null {
  if (activities.length === 0) return null;

  let weightedSum = 0;
  let totalWeight = 0;
  let latestRecordedAt: string | null = null;
  const breakdown: ScheduleProgressBreakdownRow[] = [];

  for (const activity of activities) {
    const entries = progressByActivityId.get(activity.id) ?? [];
    const latest = entries[0];
    const executedQuantity = latest?.executedQuantity ?? 0;
    const percentage = activity.quantity > 0 ? clampPercentage((executedQuantity / activity.quantity) * 100) : 0;
    const weightDays = daysBetween(activity.plannedStart, activity.plannedEnd);

    weightedSum += weightDays * percentage;
    totalWeight += weightDays;
    if (latest && (!latestRecordedAt || latest.recordedAt > latestRecordedAt)) {
      latestRecordedAt = latest.recordedAt;
    }

    breakdown.push({
      activityId: activity.id,
      activity: activity.activity,
      uom: activity.uom,
      quantity: activity.quantity,
      executedQuantity,
      percentage: Math.round(percentage),
      weightDays,
    });
  }

  const percentage = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { percentage, asOf: latestRecordedAt, breakdown };
}

/**
 * Whether a manual save from `currentValue` to `nextValue` should require a
 * reason before the UI lets it through — moving backwards always requires
 * one; moving forward only requires one when a computed suggestion exists
 * and the new value diverges from it by more than the threshold.
 */
export function manualProgressNeedsReason(
  nextValue: number,
  currentValue: number,
  computedSuggestion: number | null,
): boolean {
  if (nextValue < currentValue) return true;
  if (computedSuggestion === null) return false;
  return Math.abs(nextValue - computedSuggestion) > PROGRESS_OVERRIDE_REASON_THRESHOLD;
}

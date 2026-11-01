import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

/**
 * Computed-at-render-time progress/delay math for the Project Schedule
 * module (Part 13) — nothing here is ever persisted, matching every other
 * module's "derived values are computed, never stored" convention
 * (line amounts, closing stock, RFQ savings, e.g.).
 *
 * **FRONTEND IMPLEMENTATION DECISION — see `docs/OPEN_QUESTIONS.md` #34
 * and #50.** The owner requirements name "pro-rata progress-to-green
 * visualization" and "delay-in-days reflection" without defining the exact
 * formula. This build computes:
 *   - "expected" progress, when an activity has a monthly breakdown
 *     (`monthlyPlan.length > 0`), as a month-by-month pro-rata of that
 *     breakdown — full credit for every month already finished, a
 *     day-fraction credit for the month `asOf` falls in, nothing yet for
 *     months still ahead — per the owner's own §7b wording: *"cell colour
 *     should change to green on prorata basis based on defined quantity
 *     for the activity during the month & executed thereof."* This
 *     resolves `docs/OPEN_QUESTIONS.md` #50(c);
 *   - "expected" progress, when an activity has **no** monthly breakdown
 *     (the default — every pre-Phase-3 activity, and any activity that
 *     stays opt-out of the breakdown, see #50(a)), as the original
 *     straight-line (pro-rata) time elapsed between `plannedStart` and
 *     `plannedEnd`, clamped to 0–100%, unchanged from before this pass;
 *   - "delay in days" as simply how many days past `plannedEnd` today is,
 *     while the activity is still short of 100% complete (0 once complete,
 *     0 before `plannedEnd`, whatever the actual pace) — unaffected by the
 *     monthly-plan change above, since the owner's own delay wording names
 *     no separate monthly formula for it.
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

/**
 * Month-by-month pro-rata expected quantity from `activity.monthlyPlan`,
 * or `null` when the activity has no breakdown (`monthlyPlan.length === 0`)
 * — the caller falls back to the whole-activity straight-line formula in
 * that case. See this file's header comment and `docs/OPEN_QUESTIONS.md`
 * #50(c) for the owner wording this resolves.
 *
 * Every month strictly before the one `asOf` falls in counts fully (the
 * month's entire `plannedQuantity`); the month `asOf` falls in counts a
 * day-fraction of its `plannedQuantity`, bounded by whichever of that
 * calendar month's days actually fall within `[plannedStart, plannedEnd]`
 * (an activity can start or end mid-month); every month after that counts
 * nothing yet. `monthlyPlan` entries are always within `[plannedStart,
 * plannedEnd]`'s own months (see `ScheduleMonthlyPlanEntry`'s header
 * comment), so no entry is ever skipped as out-of-range here.
 */
function getExpectedQuantityFromMonthlyPlan(activity: ScheduleActivity, asOf: Date): number | null {
  // Defensive `?? []` — every real `ScheduleActivity` has `monthlyPlan` as a
  // required (if often empty) array, but a handful of existing unit-test
  // fixtures build a partial activity object that omits it entirely.
  const monthlyPlan = activity.monthlyPlan ?? [];
  if (monthlyPlan.length === 0) return null;

  const start = parseISODate(activity.plannedStart);
  const end = parseISODate(activity.plannedEnd);
  const sorted = [...monthlyPlan].sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
  const asOfMonthKey = `${asOf.getFullYear()}-${String(asOf.getMonth() + 1).padStart(2, "0")}`;

  let cumulative = 0;
  for (const entry of sorted) {
    if (entry.month < asOfMonthKey) {
      cumulative += entry.plannedQuantity;
      continue;
    }
    if (entry.month > asOfMonthKey) break; // this and every later month hasn't started yet

    // entry.month === asOfMonthKey — pro-rate within the days this
    // calendar month actually shares with the activity's own window.
    const [year, monthNum] = entry.month.split("-").map(Number);
    const calendarMonthStart = new Date(year, monthNum - 1, 1);
    const calendarMonthEnd = new Date(year, monthNum, 0); // day 0 of next month = last day of this one
    const windowStart = calendarMonthStart > start ? calendarMonthStart : start;
    const windowEnd = calendarMonthEnd < end ? calendarMonthEnd : end;
    const totalDaysInWindow = daysBetween(windowStart, windowEnd) + 1;
    if (totalDaysInWindow <= 0) {
      cumulative += entry.plannedQuantity;
      break;
    }
    const elapsedDaysInWindow = Math.max(0, Math.min(totalDaysInWindow, daysBetween(windowStart, asOf) + 1));
    cumulative += entry.plannedQuantity * (elapsedDaysInWindow / totalDaysInWindow);
    break;
  }
  return cumulative;
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

/**
 * Expected progress as of `asOf` (defaults to now) — month-by-month
 * pro-rata of `activity.monthlyPlan` when the activity has one (see
 * `getExpectedQuantityFromMonthlyPlan`, `docs/OPEN_QUESTIONS.md` #50(c)),
 * otherwise the original straight-line (pro-rata) time elapsed between
 * `plannedStart` and `plannedEnd`, clamped to 0–100%, unchanged.
 */
export function getExpectedPercent(activity: ScheduleActivity, asOf: Date = new Date()): number {
  const fromMonthlyPlan = getExpectedQuantityFromMonthlyPlan(activity, asOf);
  if (fromMonthlyPlan !== null) {
    if (activity.quantity <= 0) return 0;
    return Math.max(0, Math.min(100, (fromMonthlyPlan / activity.quantity) * 100));
  }

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

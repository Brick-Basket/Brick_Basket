import type { ScheduleMonthlyPlanEntry } from "@/types/domain/project-schedule";

/**
 * Pure helpers for the monthly planned-quantity breakdown added in the
 * post-Part-20 stabilization pass (Phase 3) — never persisted state, same
 * "derived values are computed, never stored" convention as
 * `schedule-progress-math.ts`. `getMonthKeysInRange` deliberately mirrors
 * `ScheduleGanttChart`'s own month-header computation (same month-cursor
 * loop) so the Gantt's displayed months and this module's planning columns
 * can never disagree about which months an activity spans.
 */

function parseISODate(value: string): Date {
  // Day-precision ISO dates ("2026-08-01") — parsed at local midnight so
  // date-only comparisons never drift a day from an implicit UTC offset,
  // matching `schedule-progress-math.ts`'s own `parseISODate`.
  return new Date(`${value}T00:00:00`);
}

function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Every "YYYY-MM" month key from `start`'s month through `end`'s month, inclusive. */
export function getMonthKeysInRange(start: string, end: string): string[] {
  const startDate = parseISODate(start);
  const endDate = parseISODate(end);
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endCursor = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  const keys: string[] = [];
  // Guard against a malformed/reversed range producing an infinite loop —
  // mirrors ScheduleActivityForm's own plannedEnd >= plannedStart validation.
  let iterations = 0;
  while (cursor.getTime() <= endCursor.getTime() && iterations < 240 /* 20 years, a generous ceiling */) {
    keys.push(monthKeyOf(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
    iterations += 1;
  }
  return keys;
}

/** "2026-08" → "Aug 2026". */
export function formatMonthKey(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  if (year === undefined || monthNum === undefined) return month;
  return new Date(year, monthNum - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function getMonthlyPlanTotal(monthlyPlan: ScheduleMonthlyPlanEntry[]): number {
  return monthlyPlan.reduce((sum, e) => sum + e.plannedQuantity, 0);
}

export function getPlannedQuantityForMonth(monthlyPlan: ScheduleMonthlyPlanEntry[], month: string): number | null {
  const entry = monthlyPlan.find((e) => e.month === month);
  return entry ? entry.plannedQuantity : null;
}

/**
 * `null` when valid. An empty `monthlyPlan` is always valid — "not broken
 * down by month yet." Once any entry exists, every entry's quantity must be
 * non-negative and the entries must sum to `quantity` (a small
 * floating-point tolerance, not exact equality, since a form field routes
 * through `parseFloat`/`.toFixed` at various points). **FRONTEND
 * IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md`: the owner
 * requirements don't confirm whether partial/incomplete monthly plans
 * should be allowed (e.g. only 3 of an activity's 5 planned months filled
 * in, summing to less than the total) — this build treats that the same as
 * any other under-total mismatch and rejects it, on the reasoning that a
 * *partial* monthly plan isn't a meaningfully different state from no plan
 * at all for validation purposes.
 */
export function validateMonthlyPlan(quantity: number, monthlyPlan: ScheduleMonthlyPlanEntry[]): string | null {
  if (monthlyPlan.length === 0) return null;
  if (monthlyPlan.some((e) => e.plannedQuantity < 0)) {
    return "Monthly planned quantities can't be negative.";
  }
  const total = getMonthlyPlanTotal(monthlyPlan);
  if (Math.abs(total - quantity) > 0.01) {
    return `Monthly planned quantities total ${total.toLocaleString("en-IN")}, but this activity's planned quantity is ${quantity.toLocaleString("en-IN")} — they must match exactly.`;
  }
  return null;
}

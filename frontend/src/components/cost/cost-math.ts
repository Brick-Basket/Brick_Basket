import type { CostEntry } from "@/types/domain/cost-entry";

/**
 * Pure, render-time-only budget/actual/variance computations backing the
 * Project Cost Accounting table and summary — per the owner's
 * "budget/actual/variance view with over/under indicators" requirement
 * (§8A). Nothing here is ever stored on `CostEntry` itself — variance is
 * always derived, matching the "computed, not stored" convention used for
 * every derived money total elsewhere in this app (e.g. Contract totals,
 * Stock's `closingStock`).
 */

export type CostVarianceStatus = "over" | "under" | "on_budget";

/** Budget minus actual — positive means under budget, negative means over. */
export function getVariance(budgetAmount: number, actualAmount: number): number {
  return budgetAmount - actualAmount;
}

/**
 * Variance as a percentage of budget, guarded against divide-by-zero
 * (an entry with no budget set yet reads as 0%, not `Infinity`/`NaN`).
 */
export function getVariancePercent(budgetAmount: number, actualAmount: number): number {
  if (!budgetAmount || budgetAmount <= 0) return 0;
  return (getVariance(budgetAmount, actualAmount) / budgetAmount) * 100;
}

export function getVarianceStatus(budgetAmount: number, actualAmount: number): CostVarianceStatus {
  if (actualAmount > budgetAmount) return "over";
  if (actualAmount < budgetAmount) return "under";
  return "on_budget";
}

export function getTotalBudget(entries: CostEntry[]): number {
  return entries.reduce((sum, e) => sum + e.budgetAmount, 0);
}

export function getTotalActual(entries: CostEntry[]): number {
  return entries.reduce((sum, e) => sum + e.actualAmount, 0);
}

export function getTotalVariance(entries: CostEntry[]): number {
  return getTotalBudget(entries) - getTotalActual(entries);
}

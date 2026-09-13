import type { DPRWorkItemHistoryEntry } from "@/lib/api/adapters/dpr-adapter";
import type { DPRWorkItemMaster } from "@/types/domain/dpr";

/**
 * Pure, render-time-only computations backing the DPR work-item table's
 * "Previous Qty."/"Cumulative Qty."/"% Complete" columns — none of it is
 * ever stored on `DPRWorkItemEntry` itself, per the field typing
 * conventions in `docs/DATA_MODELS.md`. This is a separate ledger from
 * whatever a linked `ScheduleActivity` shows — see `dpr-adapter.ts`'s
 * header comment.
 */

/**
 * Sum of `todayQty` from every earlier day's line for the same work item
 * in the same project — "earlier" means a strictly earlier `reportDate`,
 * on a *different* DPR than the one being viewed/edited (so re-editing
 * today's own report never double-counts itself as its own "previous").
 */
export function getPreviousQty(
  history: DPRWorkItemHistoryEntry[],
  workItemMasterId: string,
  currentDprId: string | null,
  currentReportDate: string,
): number {
  return history
    .filter(
      (h) =>
        h.line.workItemMasterId === workItemMasterId &&
        h.dpr.id !== currentDprId &&
        h.dpr.reportDate < currentReportDate,
    )
    .reduce((sum, h) => sum + h.line.todayQty, 0);
}

export function getCumulativeQty(previousQty: number, todayQty: number): number {
  return previousQty + todayQty;
}

export function getPercentComplete(cumulativeQty: number, plannedQty: number): number {
  if (!plannedQty || plannedQty <= 0) return 0;
  return Math.min(100, Math.max(0, (cumulativeQty / plannedQty) * 100));
}

/**
 * The most recently logged `plannedQty` for this work item on this
 * project (excluding the DPR currently being edited) — used only as a
 * convenience default when a work item is newly added to a line; always
 * editable afterward, never enforced as authoritative.
 */
export function getLatestPlannedQty(
  history: DPRWorkItemHistoryEntry[],
  workItemMasterId: string,
  currentDprId: string | null,
): number | undefined {
  const matches = history
    .filter((h) => h.line.workItemMasterId === workItemMasterId && h.dpr.id !== currentDprId)
    .sort((a, b) => {
      if (a.dpr.reportDate !== b.dpr.reportDate) return a.dpr.reportDate < b.dpr.reportDate ? 1 : -1;
      return a.line.createdAt < b.line.createdAt ? 1 : -1;
    });
  return matches[0]?.line.plannedQty;
}

export function getTotalManpower(skilled: number, unskilled: number): number {
  return (skilled || 0) + (unskilled || 0);
}

/** The unit to display for a line — the master item's UOM, or the free-text `otherUom` on one of the four catch-all rows (the master list leaves their unit unspecified). */
export function getLineUom(master: DPRWorkItemMaster | undefined, otherUom: string | undefined): string {
  if (master?.isOtherCatchAll) return otherUom || "—";
  return master?.uom || "—";
}

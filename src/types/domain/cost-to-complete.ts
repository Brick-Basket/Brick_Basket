import type { ContractCategory } from "@/types/domain/contract";

/**
 * Cost-to-Complete (Part 18) — Finance §8G.
 *
 * "Formula: Actual Cost + Remaining Estimated Cost = Forecast Final Cost.
 * Cost-to-complete table: Cost Category, Original Estimate (A), Completed
 * till date (B), Balance to complete (C), Total Estimated Value (D=B+C),
 * Variance. Business derivation rules: Original estimate derives from
 * Supply Chain → Accepted Cost Estimate. Completed till date derives from
 * vendor invoices/project cost accounting. Balance to complete includes
 * (1) ordered but yet to be completed — based on PO history/project
 * updates — and (2) balance to be ordered — derived from ACE/ACE tracing
 * for work not yet ordered. Frontend must show the calculation
 * lineage/explanation where practical."
 *
 * There is **no `CreateCostToCompleteInput`/`UpdateCostToCompleteInput`**
 * — unlike every other Part 1–17 entity, `CostToComplete` has no form and
 * no persisted record at all. It is a pure, render-time report computed
 * from four already-existing modules (`CostEntry`/Part 15, `ACEItem`/Part
 * 8, `PurchaseOrder`+`PurchaseOrderLineItem`/Part 10, `RFQ`+`RFQLine`/Part
 * 9), the same "computed, not stored" convention every derived money
 * total in this app already follows (Contract totals, Stock's
 * `closingStock`, `CostEntry`'s variance) — just composed across adapters
 * instead of within one record. See `CostToCompleteAdapter.getSummary` in
 * `src/lib/api/adapters/cost-to-complete-adapter.ts` for the full
 * calculation, and `docs/OPEN_QUESTIONS.md` #39 for every frontend
 * decision this required.
 *
 * **FRONTEND IMPLEMENTATION DECISION — the owner's ACE/PO/RFQ chain has a
 * real gap**: `ACEItem` (Part 8) carries a `rate` but no quantity (it is
 * "predefined workable rates by category," not a priced estimate), so a
 * literal "ACE × quantity" total is not computable from stored data. The
 * owner's own §8G example figure (Original budget ₹77L) is identical to
 * §8A's own example (Total Project Cost Budget ₹77L) — strong evidence
 * both refer to the same figure — so **Original Estimate (A) is sourced
 * from `CostEntry.budgetAmount`** (Part 15's project+category budget,
 * itself described as ACE-informed) rather than a fresh ACE
 * quantity×rate computation.
 */
export interface CostToCompleteRow {
  projectId: string;
  category: ContractCategory;
  /** (A) — sourced from `CostEntry.budgetAmount` for this project/category; 0 when no `CostEntry` exists yet. */
  originalEstimate: number;
  /** (B) — sourced from `CostEntry.actualAmount` for this project/category; 0 when no `CostEntry` exists yet. */
  completedToDate: number;
  /** Traced, non-rejected/non-draft `PurchaseOrder` line item value for this category (via `PurchaseOrder.rfqId` → `RFQLine.aceItemId` → `ACEItem.category`) — shown for transparency, not one of the five owner-named columns. */
  orderedTotal: number;
  /** Ordered-but-not-yet-completed component of (C) — `max(0, orderedTotal − completedToDate)`. */
  orderedNotCompleted: number;
  /** Balance-to-be-ordered component of (C) — `max(0, originalEstimate − max(completedToDate, orderedTotal))`. */
  balanceToBeOrdered: number;
  /** (C) = `orderedNotCompleted + balanceToBeOrdered`. */
  balanceToComplete: number;
  /** (D) = (B) + (C), per the owner's own `D=B+C` formula. */
  totalEstimatedValue: number;
  /** (A) − (D) — positive means the forecast lands under the original estimate, negative means a projected overrun. Same sign convention as `CostEntry`'s Budget−Actual variance (Part 15). */
  variance: number;
}

/**
 * One project's full Cost-to-Complete report — one row per
 * `ContractCategory` that has a `CostEntry`, an `ACEItem`, or a traced
 * ordered amount for this project (a category with none of the three
 * never appears), plus the owner's own §8G summary line ("Actual Cost +
 * Remaining Estimated Cost = Forecast Final Cost") totalled across every
 * row.
 */
export interface CostToCompleteSummary {
  projectId: string;
  rows: CostToCompleteRow[];
  /** Sum of every row's `originalEstimate` — "Original budget" in the owner's own §8G example. */
  totalOriginalEstimate: number;
  /** Sum of every row's `completedToDate` — "Actual cost to date." */
  totalCompletedToDate: number;
  /** Sum of every row's `balanceToComplete` — "Remaining estimated cost." */
  totalBalanceToComplete: number;
  /** Sum of every row's `totalEstimatedValue` — "Forecasted final cost." */
  totalEstimatedValue: number;
  /** `totalOriginalEstimate − totalEstimatedValue`. */
  totalVariance: number;
  /**
   * Traced `PurchaseOrder` line item value that could **not** be attributed
   * to any category — its `RFQLine.aceItemId` was `null` (an "additional"/
   * free-entry requisition line with no ACE reference, Part 8/9's own
   * `null`-aceRate case). Shown as its own figure rather than silently
   * dropped or force-assigned to a category — see `docs/OPEN_QUESTIONS.md`
   * #39.
   */
  unallocatedOrderedTotal: number;
}

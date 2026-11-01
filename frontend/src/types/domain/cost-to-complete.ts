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
 * from five already-existing modules (`CostEntry`/Part 15, `ACEItem`/Part
 * 8, `PurchaseRequisition`+`MaterialRequirement`/Part 8,
 * `PurchaseOrder`+`PurchaseOrderLineItem`/Part 10, `RFQ`+`RFQLine`/Part
 * 9), the same "computed, not stored" convention every derived money
 * total in this app already follows (Contract totals, Stock's
 * `closingStock`, `CostEntry`'s variance) — just composed across adapters
 * instead of within one record. See `CostToCompleteAdapter.getSummary` in
 * `src/lib/api/adapters/cost-to-complete-adapter.ts` for the full
 * calculation, and `docs/OPEN_QUESTIONS.md` #39 for every frontend
 * decision this required.
 *
 * **Spec-review correction — Original Estimate (A) now genuinely derives
 * from ACE where it can**: `ACEItem` (Part 8) carries a `rate` but no
 * project-wide quantity of its own, so there's still no single "ACE ×
 * total scope" figure sitting in one place. What *does* exist is real
 * quantity: every `MaterialRequirement` line raised against a predefined
 * `ACEItem` (Part 8's "total material requirement identified for the
 * site"). `originalEstimate` is now `Σ(ACEItem.rate × MaterialRequirement.quantity)`,
 * grouped by the ACE item's category, across every one of the project's
 * requisitions that hasn't been rejected — a genuine ACE trace, not a
 * manual number, for any category where that requirement has actually
 * been raised. A category with no such requisition line yet falls back
 * to `CostEntry.budgetAmount` (Part 15's project+category budget, itself
 * described as ACE-informed) so an estimate is still shown before Supply
 * Chain has raised anything against it — `originalEstimateSource` on each
 * row says which of the two produced that row's figure.
 *
 * **Spec-review correction — Completed till date (B) now genuinely
 * derives from vendor Invoices where it can, matching the owner's exact
 * wording**: the owner names "vendor invoices/project cost accounting" as
 * (B)'s two sources. A flat `Invoice.invoiceAmount` carries no category of
 * its own, so attributing it needs the same ACE/RFQ/PO trace already used
 * for "ordered" below — every `Invoice` for the project is resolved to its
 * source `PurchaseOrder`, and the invoice's amount is apportioned across
 * that PO's own traceable categories in proportion to each category's
 * share of the PO's ordered value (one PO's line items can span more than
 * one ACE category). An invoice whose PO has no traceable category at all
 * can't be attributed anywhere — its amount is summed into
 * `CostToCompleteSummary.unallocatedCompletedTotal` instead, the same
 * treatment `unallocatedOrderedTotal` already gives an unattributable
 * ordered amount. A category with no traced invoice yet falls back to
 * `CostEntry.actualAmount` (0 if neither exists) — `completedToDateSource`
 * on each row says which of the two produced that row's figure.
 *
 * **A second, transparency-only trace — `completedToDatePaid`** —
 * apportions traced vendor *Payments* (`direction: "payment"`, via each
 * Payment's own `Invoice` → `PurchaseOrder`) the same way, so the
 * breakdown sheet can show "invoiced" (B, the owner's figure) alongside
 * "actually paid so far" (cash basis) when they differ — e.g. an invoice
 * only partially settled. `completedToDatePaid` is never part of the
 * B/C/D/Variance formula; it is display-only. Unattributable payment
 * amounts are summed into `CostToCompleteSummary.unallocatedPaidTotal`,
 * the payment-side counterpart to `unallocatedCompletedTotal`.
 */
export interface CostToCompleteRow {
  projectId: string;
  category: ContractCategory;
  /**
   * (A) — `Σ(ACEItem.rate × MaterialRequirement.quantity)` for this
   * project/category's non-rejected requisition lines when any exist,
   * else `CostEntry.budgetAmount`, else 0. See `originalEstimateSource`.
   */
  originalEstimate: number;
  /** Which source produced `originalEstimate` above, for the breakdown sheet's calculation-lineage display. */
  originalEstimateSource: "accepted_cost_estimate" | "cost_entry_budget";
  /**
   * (B) — traced vendor `Invoice` amount apportioned to this category when
   * any exists, else `CostEntry.actualAmount`, else 0. Matches the owner's
   * own "vendor invoices" wording for this figure. See
   * `completedToDateSource`.
   */
  completedToDate: number;
  /** Which source produced `completedToDate` above, for the breakdown sheet's calculation-lineage display. */
  completedToDateSource: "invoices" | "cost_entry_actual";
  /**
   * Transparency-only: traced vendor `Payment` amount (cash actually paid,
   * not merely invoiced) apportioned to this category — 0 when nothing has
   * been paid yet. Never part of the (B)/(C)/(D)/Variance formula; shown
   * alongside `completedToDate` so a partially-paid invoice is visible as
   * such. See this file's own header comment.
   */
  completedToDatePaid: number;
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
  /** Sum of every row's `completedToDate` — "Actual cost to date," now invoice-traced per the owner's own wording. */
  totalCompletedToDate: number;
  /** Sum of every row's `completedToDatePaid` — transparency-only cash-paid total, never part of the §8G formula. See `CostToCompleteRow.completedToDatePaid`. */
  totalPaidToDate: number;
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
  /**
   * The vendor-`Invoice` counterpart to `unallocatedOrderedTotal` above —
   * the amount of every `Invoice` for this project whose `PurchaseOrder`
   * had no traceable category at all (every line "additional"/
   * unallocated), so it couldn't be apportioned to any category row
   * either. See `CostToCompleteRow.completedToDateSource`.
   */
  unallocatedCompletedTotal: number;
  /**
   * The transparency-only, payment-side counterpart to
   * `unallocatedCompletedTotal` — the amount of every traced
   * `direction: "payment"` row whose `Invoice`'s `PurchaseOrder` had no
   * traceable category at all. Never part of the §8G formula. See
   * `CostToCompleteRow.completedToDatePaid`.
   */
  unallocatedPaidTotal: number;
}

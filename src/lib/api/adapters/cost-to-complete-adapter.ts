import type { ContractCategory } from "@/types/domain/contract";
import type { CostToCompleteRow, CostToCompleteSummary } from "@/types/domain/cost-to-complete";
import type { PurchaseOrderStatus } from "@/types/domain/purchase-order";
import { costAdapter } from "@/lib/api/adapters/cost-adapter";
import { aceAdapter } from "@/lib/api/adapters/ace-adapter";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";
import { rfqAdapter } from "@/lib/api/adapters/rfq-adapter";

/**
 * Adapter boundary for the Cost-to-Complete report (Part 18, §8G). There
 * is **no mock data file of its own** — unlike every other adapter in
 * this app, this one owns no records. It is a pure, render-time
 * aggregate composed entirely from four already-existing adapters' own
 * public methods (never their mock arrays directly, the same
 * cross-adapter composition discipline `RFQAdapter.create`/
 * `PurchaseOrdersAdapter.create`/`GSTRAdapter.create` already established):
 * `costAdapter` (Part 15 — Original Estimate/Completed-to-date),
 * `aceAdapter` (Part 8 — the category universe), `purchaseOrdersAdapter`
 * (Part 10 — "PO history") and `rfqAdapter` (Part 9 — the
 * `RFQLine.aceItemId` link that traces a PO line item back to an ACE
 * category). A real backend would compute the same join server-side and
 * expose it as a single read endpoint — see the contract below.
 *
 * **Calculation — see `CostToCompleteRow`'s field comments for the "why"
 * behind each source, and `docs/OPEN_QUESTIONS.md` #39 for the full list
 * of frontend decisions this required:**
 *
 * 1. `originalEstimate` (A) = that project+category's `CostEntry.budgetAmount` (0 if none).
 * 2. `completedToDate` (B) = that project+category's `CostEntry.actualAmount` (0 if none).
 * 3. `orderedTotal` = Σ `quantity × rate` of every line item on a non-`draft`/non-`rejected`
 *    Purchase Order for this project ("PO history"), traced to a category via
 *    `PurchaseOrder.rfqId` → `RFQLine` (matched by the line item's `rfqLineId`) →
 *    `RFQLine.aceItemId` → `ACEItem.category`. A line whose source requisition line
 *    was `"additional"` (free-entry, no ACE reference) has `aceItemId: null` and
 *    cannot be traced — its amount is added to `unallocatedOrderedTotal` instead of
 *    any category row.
 * 4. `orderedNotCompleted` (part of C) = `max(0, orderedTotal − completedToDate)` —
 *    the portion of what's been ordered that isn't yet reflected in actual spend.
 * 5. `balanceToBeOrdered` (part of C) = `max(0, originalEstimate − max(completedToDate, orderedTotal))` —
 *    whichever of "already spent" or "already ordered" is larger already accounts
 *    for part of the original estimate; the rest of the estimate is what's left to
 *    order. (Computing this as `A − orderedTotal` alone, ignoring `completedToDate`,
 *    would double-count categories where real spend already exceeds what this
 *    build can trace through the ACE/RFQ/PO chain — most `actual` spend in this
 *    mock dataset has no traced PO at all, since `PurchaseOrderLineItem` only
 *    carries a category via an *optional* ACE link two hops away.)
 * 6. `balanceToComplete` (C) = `orderedNotCompleted + balanceToBeOrdered`.
 * 7. `totalEstimatedValue` (D) = `completedToDate + balanceToComplete`, exactly the
 *    owner's own `D = B + C`.
 * 8. `variance` = `originalEstimate − totalEstimatedValue`, same sign convention as
 *    `CostEntry`'s Budget−Actual variance (positive = under, negative = over) — and
 *    this formula gracefully reduces to exactly that variance whenever a category
 *    has no traceable PO activity, which is the common case in this dataset.
 *
 * The owner's explicit "ordered/composite works, not supply components" split for
 * `orderedNotCompleted` is **not implemented** — `ContractCategory` (the only
 * category vocabulary this app has) has no confirmed supply-vs-service/composite
 * classification, so splitting by it would be an invented taxonomy. Every category
 * is treated uniformly. Flagged, not silently assumed — see
 * `docs/OPEN_QUESTIONS.md` #39.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 18) for full detail:
 *   GET /api/cost-to-complete?projectId=:id — the full computed report for one project
 */
export interface CostToCompleteAdapter {
  getSummary(projectId: string): Promise<CostToCompleteSummary>;
}

/** Purchase Orders counted as "PO history" commitments — everything past draft that wasn't rejected. */
const ORDERED_PO_STATUSES: PurchaseOrderStatus[] = [
  "pending_approval_l1",
  "pending_approval_l2",
  "approved",
  "released",
  "issued",
];

class MockCostToCompleteAdapter implements CostToCompleteAdapter {
  async getSummary(projectId: string): Promise<CostToCompleteSummary> {
    await delay(350);

    const [costResult, aceResult, poResult] = await Promise.all([
      costAdapter.list({ projectId, pageSize: 200 }),
      aceAdapter.list({ projectId, pageSize: 200 }),
      purchaseOrdersAdapter.list({ projectId, pageSize: 200 }),
    ]);

    const costByCategory = new Map(costResult.items.map((c) => [c.category, c]));

    // Category universe: every category with a CostEntry or an ACEItem for
    // this project — a category with neither never appears as a row, even
    // if a stray PO line item traces to it (that would be a data
    // inconsistency this mock dataset doesn't create, but the guard keeps
    // the report honest rather than inventing a row from ordering alone).
    const categories = new Set<ContractCategory>([
      ...costResult.items.map((c) => c.category),
      ...aceResult.items.map((a) => a.category),
    ]);

    // Trace every "ordered" PO's line items back to an ACE category.
    const orderedPOs = poResult.items.filter((po) => ORDERED_PO_STATUSES.includes(po.status));
    const orderedByCategory = new Map<ContractCategory, number>();
    let unallocatedOrderedTotal = 0;

    // RFQ lines are fetched once per distinct source RFQ, not once per PO,
    // since several POs can share no RFQ but never the reverse (one RFQ ->
    // several vendor-grouped POs, Part 10) — still cheap either way for a
    // mock dataset, but this avoids redundant calls on a real backend join.
    const lineCache = new Map<string, Awaited<ReturnType<typeof rfqAdapter.listLines>>>();
    const aceCategoryCache = new Map<string, ContractCategory | null>();

    for (const po of orderedPOs) {
      if (!lineCache.has(po.rfqId)) {
        lineCache.set(po.rfqId, await rfqAdapter.listLines(po.rfqId));
      }
      const rfqLines = lineCache.get(po.rfqId) ?? [];
      const lineItems = await purchaseOrdersAdapter.listLineItems(po.id);

      for (const item of lineItems) {
        const amount = item.quantity * item.rate;
        const rfqLine = rfqLines.find((l) => l.id === item.rfqLineId);
        const aceItemId = rfqLine?.aceItemId ?? null;

        if (!aceItemId) {
          unallocatedOrderedTotal += amount;
          continue;
        }
        if (!aceCategoryCache.has(aceItemId)) {
          const aceItem = await aceAdapter.get(aceItemId);
          aceCategoryCache.set(aceItemId, aceItem?.category ?? null);
        }
        const category = aceCategoryCache.get(aceItemId) ?? null;
        if (!category) {
          unallocatedOrderedTotal += amount;
          continue;
        }
        categories.add(category);
        orderedByCategory.set(category, (orderedByCategory.get(category) ?? 0) + amount);
      }
    }

    const rows: CostToCompleteRow[] = [...categories].map((category) => {
      const originalEstimate = costByCategory.get(category)?.budgetAmount ?? 0;
      const completedToDate = costByCategory.get(category)?.actualAmount ?? 0;
      const orderedTotal = orderedByCategory.get(category) ?? 0;

      const orderedNotCompleted = Math.max(0, orderedTotal - completedToDate);
      const balanceToBeOrdered = Math.max(0, originalEstimate - Math.max(completedToDate, orderedTotal));
      const balanceToComplete = orderedNotCompleted + balanceToBeOrdered;
      const totalEstimatedValue = completedToDate + balanceToComplete;
      const variance = originalEstimate - totalEstimatedValue;

      return {
        projectId,
        category,
        originalEstimate,
        completedToDate,
        orderedTotal,
        orderedNotCompleted,
        balanceToBeOrdered,
        balanceToComplete,
        totalEstimatedValue,
        variance,
      };
    });

    rows.sort((a, b) => a.category.localeCompare(b.category));

    const totals = rows.reduce(
      (acc, row) => ({
        totalOriginalEstimate: acc.totalOriginalEstimate + row.originalEstimate,
        totalCompletedToDate: acc.totalCompletedToDate + row.completedToDate,
        totalBalanceToComplete: acc.totalBalanceToComplete + row.balanceToComplete,
        totalEstimatedValue: acc.totalEstimatedValue + row.totalEstimatedValue,
      }),
      { totalOriginalEstimate: 0, totalCompletedToDate: 0, totalBalanceToComplete: 0, totalEstimatedValue: 0 },
    );

    return {
      projectId,
      rows,
      ...totals,
      totalVariance: totals.totalOriginalEstimate - totals.totalEstimatedValue,
      unallocatedOrderedTotal,
    };
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const costToCompleteAdapter: CostToCompleteAdapter = new MockCostToCompleteAdapter();

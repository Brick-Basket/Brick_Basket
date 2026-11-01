import type { ContractCategory } from "@/types/domain/contract";
import type { CostToCompleteRow, CostToCompleteSummary } from "@/types/domain/cost-to-complete";
import type { PurchaseOrderStatus } from "@/types/domain/purchase-order";
import type { PurchaseRequisitionStatus } from "@/types/domain/requisition";
import { costAdapter } from "@/lib/api/adapters/cost-adapter";
import { aceAdapter } from "@/lib/api/adapters/ace-adapter";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";
import { rfqAdapter } from "@/lib/api/adapters/rfq-adapter";
import { requisitionsAdapter } from "@/lib/api/adapters/requisitions-adapter";
import { paymentAdapter } from "@/lib/api/adapters/payments-adapter";
import { invoiceAdapter } from "@/lib/api/adapters/invoices-adapter";

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
 * 1. `originalEstimate` (A) = Σ(`ACEItem.rate` × `MaterialRequirement.quantity`) for every
 *    `source: "predefined"` line on a non-rejected requisition for this project, traced to
 *    a category via `MaterialRequirement.aceItemId` → `ACEItem.category` (spec-review
 *    correction — a genuine ACE trace, replacing a flat `CostEntry.budgetAmount` read).
 *    A category with no such requisition line yet falls back to that project+category's
 *    `CostEntry.budgetAmount` (0 if neither exists) — `originalEstimateSource` records which.
 * 2. `completedToDate` (B) = Σ every `Invoice` for this project, apportioned to this category
 *    via its source `PurchaseOrder`'s own category mix (reusing the same per-PO breakdown step 3
 *    below computes), when any exists, else that project+category's `CostEntry.actualAmount`
 *    (0 if neither exists) — spec-review correction, matching the owner's own "vendor invoices"
 *    wording; `completedToDateSource` on each row records which. An invoice whose PO has no
 *    traceable category at all is summed into `unallocatedCompletedTotal` instead, mirroring
 *    step 3's `unallocatedOrderedTotal`. A second, transparency-only pass apportions traced
 *    vendor `Payment` (`direction: "payment"`) amounts the same way into `completedToDatePaid`/
 *    `unallocatedPaidTotal` — cash actually paid, shown alongside (B) but never part of the
 *    formula below, since a partially-paid invoice would otherwise understate "completed."
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

/** Requisitions counted toward "total material requirement identified for the site" (Original Estimate, A) — everything not rejected, same "past draft that wasn't rejected" spirit as `ORDERED_PO_STATUSES` above. */
const ESTIMATE_REQUISITION_STATUSES: PurchaseRequisitionStatus[] = ["draft", "submitted", "approved"];

class MockCostToCompleteAdapter implements CostToCompleteAdapter {
  async getSummary(projectId: string): Promise<CostToCompleteSummary> {
    await delay(350);

    const [costResult, aceResult, poResult, requisitionResult] = await Promise.all([
      costAdapter.list({ projectId, pageSize: 200 }),
      aceAdapter.list({ projectId, pageSize: 200 }),
      purchaseOrdersAdapter.list({ projectId, pageSize: 200 }),
      requisitionsAdapter.list({ projectId, pageSize: 200 }),
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

    // ACEItem lookups are shared across both traces below (Original
    // Estimate, from requisition lines; ordered/completed value, from PO
    // line items) — both ultimately resolve a `MaterialRequirement`'s or
    // `RFQLine`'s `aceItemId` back to an `ACEItem`, so one cache serves
    // both rather than hitting the adapter twice for the same id.
    const aceItemCache = new Map<string, Awaited<ReturnType<typeof aceAdapter.get>>>();
    async function getACEItem(aceItemId: string) {
      if (!aceItemCache.has(aceItemId)) {
        aceItemCache.set(aceItemId, await aceAdapter.get(aceItemId));
      }
      return aceItemCache.get(aceItemId) ?? null;
    }

    // Original Estimate (A): Σ(ACE rate × requisitioned quantity) for every
    // predefined-source requisition line not on a rejected requisition —
    // the project's actual identified material requirement, priced at its
    // Accepted Cost Estimate rate. A category with no such line yet has no
    // entry here and falls back to CostEntry.budgetAmount below.
    const originalEstimateByCategory = new Map<ContractCategory, number>();
    const estimableRequisitions = requisitionResult.items.filter((r) => ESTIMATE_REQUISITION_STATUSES.includes(r.status));
    for (const requisition of estimableRequisitions) {
      const lines = await requisitionsAdapter.listLines(requisition.id);
      for (const line of lines) {
        if (line.source !== "predefined" || !line.aceItemId) continue;
        const aceItem = await getACEItem(line.aceItemId);
        if (!aceItem) continue; // referenced ACE item no longer exists — nothing to attribute
        categories.add(aceItem.category);
        originalEstimateByCategory.set(
          aceItem.category,
          (originalEstimateByCategory.get(aceItem.category) ?? 0) + aceItem.rate * line.quantity,
        );
      }
    }

    // Trace every "ordered" PO's line items back to an ACE category.
    const orderedPOs = poResult.items.filter((po) => ORDERED_PO_STATUSES.includes(po.status));
    const orderedByCategory = new Map<ContractCategory, number>();
    let unallocatedOrderedTotal = 0;

    // Per-PO category breakdown — built alongside orderedByCategory above,
    // for Completed till date (B) below to reuse: a Payment traces to an
    // Invoice, an Invoice to one PO, but not to any one category (Invoice
    // has no category field), so attributing a payment means knowing how
    // *that specific PO's* own ordered value splits across categories.
    const poCategoryBreakdown = new Map<string, Map<ContractCategory, number>>();
    const poTraceableTotal = new Map<string, number>();

    // RFQ lines are fetched once per distinct source RFQ, not once per PO,
    // since several POs can share no RFQ but never the reverse (one RFQ ->
    // several vendor-grouped POs, Part 10) — still cheap either way for a
    // mock dataset, but this avoids redundant calls on a real backend join.
    const lineCache = new Map<string, Awaited<ReturnType<typeof rfqAdapter.listLines>>>();

    for (const po of orderedPOs) {
      if (!lineCache.has(po.rfqId)) {
        lineCache.set(po.rfqId, await rfqAdapter.listLines(po.rfqId));
      }
      const rfqLines = lineCache.get(po.rfqId) ?? [];
      const lineItems = await purchaseOrdersAdapter.listLineItems(po.id);

      const perPoCategory = new Map<ContractCategory, number>();
      let perPoTraceable = 0;

      for (const item of lineItems) {
        const amount = item.quantity * item.rate;
        const rfqLine = rfqLines.find((l) => l.id === item.rfqLineId);
        const aceItemId = rfqLine?.aceItemId ?? null;

        if (!aceItemId) {
          unallocatedOrderedTotal += amount;
          continue;
        }
        const aceItem = await getACEItem(aceItemId);
        const category = aceItem?.category ?? null;
        if (!category) {
          unallocatedOrderedTotal += amount;
          continue;
        }
        categories.add(category);
        orderedByCategory.set(category, (orderedByCategory.get(category) ?? 0) + amount);
        perPoCategory.set(category, (perPoCategory.get(category) ?? 0) + amount);
        perPoTraceable += amount;
      }

      poCategoryBreakdown.set(po.id, perPoCategory);
      poTraceableTotal.set(po.id, perPoTraceable);
    }

    // Completed till date (B): Σ vendor Invoice amount, apportioned across
    // categories by the share of the source PO's own traceable ordered
    // value each category represents — a genuine link into Part 16
    // (Payments & Receipts), closing the gap docs/OPEN_QUESTIONS.md #39(b)
    // flagged ("Invoice carries no category field"), and matching the
    // owner's own "vendor invoices" wording for this figure. An invoice
    // whose PO has no traceable category at all can't be attributed
    // anywhere; its amount goes to unallocatedCompletedTotal instead,
    // mirroring unallocatedOrderedTotal.
    const completedToDateByCategory = new Map<ContractCategory, number>();
    let unallocatedCompletedTotal = 0;
    const invoices = await invoiceAdapter.list({ projectId, pageSize: 200 });

    for (const invoice of invoices.items) {
      const breakdown = poCategoryBreakdown.get(invoice.purchaseOrderId);
      const traceableTotal = poTraceableTotal.get(invoice.purchaseOrderId) ?? 0;
      if (!breakdown || traceableTotal <= 0) {
        unallocatedCompletedTotal += invoice.invoiceAmount;
        continue;
      }
      for (const [category, categoryAmount] of breakdown) {
        categories.add(category);
        const share = invoice.invoiceAmount * (categoryAmount / traceableTotal);
        completedToDateByCategory.set(category, (completedToDateByCategory.get(category) ?? 0) + share);
      }
    }

    // Transparency-only second pass: the same apportionment, but for
    // traced vendor Payments (cash actually disbursed) rather than
    // Invoices (cash recognized/billed) — lets the breakdown sheet show
    // "invoiced" next to "actually paid" when an invoice is only
    // partially settled. Never folded into completedToDate itself. Only
    // direction: "payment" rows count (vendor spend) — a "receipt"
    // (customer money in) has nothing to do with (B).
    const paidToDateByCategory = new Map<ContractCategory, number>();
    let unallocatedPaidTotal = 0;
    const payments = await paymentAdapter.list({ projectId, direction: "payment", pageSize: 200 });
    const invoiceCache = new Map<string, Awaited<ReturnType<typeof invoiceAdapter.get>>>();
    async function getInvoice(invoiceId: string) {
      if (!invoiceCache.has(invoiceId)) {
        invoiceCache.set(invoiceId, await invoiceAdapter.get(invoiceId));
      }
      return invoiceCache.get(invoiceId) ?? null;
    }

    for (const payment of payments.items) {
      if (!payment.invoiceId) continue; // defensive — every "payment"-direction row has one, per CreatePaymentInput
      const invoice = await getInvoice(payment.invoiceId);
      if (!invoice) continue;
      const breakdown = poCategoryBreakdown.get(invoice.purchaseOrderId);
      const traceableTotal = poTraceableTotal.get(invoice.purchaseOrderId) ?? 0;
      if (!breakdown || traceableTotal <= 0) {
        unallocatedPaidTotal += payment.amount;
        continue;
      }
      for (const [category, categoryAmount] of breakdown) {
        categories.add(category);
        const share = payment.amount * (categoryAmount / traceableTotal);
        paidToDateByCategory.set(category, (paidToDateByCategory.get(category) ?? 0) + share);
      }
    }

    const rows: CostToCompleteRow[] = [...categories].map((category) => {
      const aceOriginalEstimate = originalEstimateByCategory.get(category);
      const originalEstimate = aceOriginalEstimate ?? costByCategory.get(category)?.budgetAmount ?? 0;
      const originalEstimateSource: CostToCompleteRow["originalEstimateSource"] =
        aceOriginalEstimate !== undefined ? "accepted_cost_estimate" : "cost_entry_budget";
      const invoiceTracedCompleted = completedToDateByCategory.get(category);
      const completedToDate = invoiceTracedCompleted ?? costByCategory.get(category)?.actualAmount ?? 0;
      const completedToDateSource: CostToCompleteRow["completedToDateSource"] =
        invoiceTracedCompleted !== undefined ? "invoices" : "cost_entry_actual";
      const completedToDatePaid = paidToDateByCategory.get(category) ?? 0;
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
        originalEstimateSource,
        completedToDate,
        completedToDateSource,
        completedToDatePaid,
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
        totalPaidToDate: acc.totalPaidToDate + row.completedToDatePaid,
        totalBalanceToComplete: acc.totalBalanceToComplete + row.balanceToComplete,
        totalEstimatedValue: acc.totalEstimatedValue + row.totalEstimatedValue,
      }),
      { totalOriginalEstimate: 0, totalCompletedToDate: 0, totalPaidToDate: 0, totalBalanceToComplete: 0, totalEstimatedValue: 0 },
    );

    return {
      projectId,
      rows,
      ...totals,
      totalVariance: totals.totalOriginalEstimate - totals.totalEstimatedValue,
      unallocatedOrderedTotal,
      unallocatedCompletedTotal,
      unallocatedPaidTotal,
    };
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const costToCompleteAdapter: CostToCompleteAdapter = new MockCostToCompleteAdapter();

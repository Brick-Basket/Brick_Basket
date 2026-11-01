import { describe, expect, it } from "vitest";
import { costToCompleteAdapter } from "./cost-to-complete-adapter";
import { createApprovedRequisition, createFinalizedRFQ, TEST_ACTOR } from "./test-fixtures";
import { purchaseOrdersAdapter } from "./purchase-orders-adapter";
import { requisitionsAdapter } from "./requisitions-adapter";
import { invoiceAdapter } from "./invoices-adapter";
import { paymentAdapter } from "./payments-adapter";

/**
 * Core derivation only — this adapter has no mock data of its own (see its
 * own header comment), so a fresh, unused project id keeps the report free
 * of any pre-existing `CostEntry`/`ACEItem`/PO for that project, isolating
 * exactly the ordered-PO-tracing math this test is meant to check. Not
 * aiming for full coverage of every category/edge case here — see
 * `docs/OPEN_QUESTIONS.md` #39 for the frontend decisions behind the formula.
 */
describe("costToCompleteAdapter — core derivation", () => {
  it("traces an issued PO's line back to its ACE category and derives balance/variance correctly with no CostEntry on record", async () => {
    const projectId = `proj_test_ctc_${Math.random().toString(36).slice(2, 8)}`;
    const requisition = await createApprovedRequisition(projectId, 500); // ace_1 → category "civil", rate ₹68/kg
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 100, requisition });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);
    // Left at "pending_approval_l2" deliberately — ORDERED_PO_STATUSES
    // counts every past-draft, non-rejected status as "PO history", not
    // just issued ones.

    const summary = await costToCompleteAdapter.getSummary(projectId);
    const civilRow = summary.rows.find((r) => r.category === "civil");
    expect(civilRow).toBeDefined();

    const orderedTotal = 500 * 100; // quantity × quoted rate
    const originalEstimate = 500 * 68; // ace_1's own quantity (500, from the requisition line) × its ACE rate (₹68/kg)
    expect(civilRow?.originalEstimate).toBe(originalEstimate); // genuinely ACE-derived — this requisition's own predefined line against ace_1
    expect(civilRow?.originalEstimateSource).toBe("accepted_cost_estimate");
    expect(civilRow?.completedToDate).toBe(0); // no Invoice traced for this fresh project, and no CostEntry either
    expect(civilRow?.completedToDateSource).toBe("cost_entry_actual");
    expect(civilRow?.completedToDatePaid).toBe(0); // no Payment traced either
    expect(civilRow?.orderedTotal).toBe(orderedTotal);
    expect(civilRow?.orderedNotCompleted).toBe(orderedTotal); // max(0, orderedTotal - 0)
    expect(civilRow?.balanceToBeOrdered).toBe(0); // max(0, originalEstimate - max(0, orderedTotal)) = 0, since orderedTotal > originalEstimate
    expect(civilRow?.balanceToComplete).toBe(orderedTotal);
    expect(civilRow?.totalEstimatedValue).toBe(orderedTotal); // completedToDate + balanceToComplete
    expect(civilRow?.variance).toBe(originalEstimate - orderedTotal); // originalEstimate - totalEstimatedValue

    expect(summary.totalOriginalEstimate).toBe(originalEstimate);
    expect(summary.totalEstimatedValue).toBe(orderedTotal);
    expect(summary.totalVariance).toBe(originalEstimate - orderedTotal);
    expect(summary.unallocatedOrderedTotal).toBe(0); // the line traced cleanly via ace_1
  });

  it("traces a vendor Invoice back to its PO's ACE category for Completed till date (B), with its partial Payment shown separately", async () => {
    const projectId = `proj_test_ctc_pay_${Math.random().toString(36).slice(2, 8)}`;
    const requisition = await createApprovedRequisition(projectId, 500); // ace_1 → category "civil", rate ₹68/kg
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 100, requisition });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel2(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.release(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.issue(po.id, TEST_ACTOR); // Invoice can only be created against an issued PO

    const invoice = await invoiceAdapter.create(
      { purchaseOrderId: po.id, invoiceNumber: "TEST-INV-1", invoiceDate: "2026-01-01", invoiceAmount: 50_000 },
      TEST_ACTOR,
    );
    // Only partially paid — (B) should still reflect the full invoiced
    // amount (the owner's own "vendor invoices" wording), with the
    // smaller paid figure surfaced separately for transparency only.
    await paymentAdapter.create(
      { direction: "payment", projectId, invoiceId: invoice.id, amount: 30_000, paymentDate: "2026-01-05", mode: "bank_transfer" },
      TEST_ACTOR,
    );

    const summary = await costToCompleteAdapter.getSummary(projectId);
    const civilRow = summary.rows.find((r) => r.category === "civil");
    expect(civilRow).toBeDefined();

    // The PO's only line is 100% traceable to "civil" via ace_1, so the
    // whole invoice (and payment) amount apportions to that one category.
    expect(civilRow?.completedToDate).toBe(50_000); // invoice-traced, not payment-traced
    expect(civilRow?.completedToDateSource).toBe("invoices");
    expect(civilRow?.completedToDatePaid).toBe(30_000); // transparency-only, cash actually paid
    expect(summary.totalCompletedToDate).toBe(50_000);
    expect(summary.totalPaidToDate).toBe(30_000);
    expect(summary.unallocatedCompletedTotal).toBe(0); // the PO traced cleanly via ace_1, so nothing is unallocated
    expect(summary.unallocatedPaidTotal).toBe(0);
  });

  it("traces a vendor Invoice with no Payment yet — completedToDate reflects the full invoice, completedToDatePaid stays 0", async () => {
    const projectId = `proj_test_ctc_unpaid_${Math.random().toString(36).slice(2, 8)}`;
    const requisition = await createApprovedRequisition(projectId, 500);
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 100, requisition });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel2(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.release(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.issue(po.id, TEST_ACTOR);

    await invoiceAdapter.create(
      { purchaseOrderId: po.id, invoiceNumber: "TEST-INV-2", invoiceDate: "2026-01-01", invoiceAmount: 50_000 },
      TEST_ACTOR,
    );
    // Deliberately no Payment created against this invoice.

    const summary = await costToCompleteAdapter.getSummary(projectId);
    const civilRow = summary.rows.find((r) => r.category === "civil");
    expect(civilRow?.completedToDate).toBe(50_000);
    expect(civilRow?.completedToDateSource).toBe("invoices");
    expect(civilRow?.completedToDatePaid).toBe(0);
    expect(summary.totalPaidToDate).toBe(0);
  });

  it("returns an empty report for a project with no CostEntry, ACEItem, or ordered PO activity at all", async () => {
    const projectId = `proj_test_ctc_empty_${Math.random().toString(36).slice(2, 8)}`;
    const summary = await costToCompleteAdapter.getSummary(projectId);
    expect(summary.rows).toHaveLength(0);
    expect(summary.totalOriginalEstimate).toBe(0);
    expect(summary.totalEstimatedValue).toBe(0);
    expect(summary.totalVariance).toBe(0);
  });

  it("adds a requisition line with no ACE reference (source: 'additional') to unallocatedOrderedTotal, not to any category row", async () => {
    const projectId = `proj_test_ctc_unalloc_${Math.random().toString(36).slice(2, 8)}`;
    const requisition = await requisitionsAdapter.create(
      { projectId, lines: [{ source: "additional", description: "Custom item", uom: "unit", quantity: 10 }] },
      TEST_ACTOR,
    );
    await requisitionsAdapter.submit(requisition.id, TEST_ACTOR);
    const approved = await requisitionsAdapter.decide(requisition.id, "approved", TEST_ACTOR);
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_2", rate: 20, requisition: approved });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_2" }, TEST_ACTOR);
    await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);

    const summary = await costToCompleteAdapter.getSummary(projectId);
    expect(summary.rows).toHaveLength(0); // no traceable category — nothing to build a row from
    expect(summary.unallocatedOrderedTotal).toBe(10 * 20);
  });
});

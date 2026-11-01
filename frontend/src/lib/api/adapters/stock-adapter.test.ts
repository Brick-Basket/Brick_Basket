import { describe, expect, it } from "vitest";
import { stockAdapter } from "./stock-adapter";
import { grnAdapter } from "./grn-adapter";
import { purchaseOrdersAdapter } from "./purchase-orders-adapter";
import { storeRequisitionsAdapter } from "./store-requisitions-adapter";
import { wastageAdapter } from "./wastage-adapter";
import { createApprovedRequisition, createFinalizedRFQ, TEST_ACTOR } from "./test-fixtures";

/**
 * Cross-module trace only (BrickBasket spec-review correction, resolving
 * docs/OPEN_QUESTIONS.md #32's "4 independent silos" gap) — `getTrace` is
 * a read-only reconciliation view, never a write into `StockEntry` (see
 * that method's own doc comment), so these tests check what it reports,
 * not any change to the Stock Statement ledger itself.
 */
describe("stockAdapter — cross-module trace (GRN / Store Requisition / Wastage)", () => {
  it("traces a GRN receipt tagged with a Stock Material into getTrace's received figure", async () => {
    const projectId = `proj_test_stock_grn_${Math.random().toString(36).slice(2, 8)}`;
    const requisition = await createApprovedRequisition(projectId, 10); // ace_1 → TMT Steel, civil
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 50, requisition });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel2(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.release(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.issue(po.id, TEST_ACTOR); // a GRN can only be recorded against an issued PO

    const [poLine] = await purchaseOrdersAdapter.listLineItems(po.id);
    if (!poLine) throw new Error("Expected the issued PO to have at least one line item.");

    await grnAdapter.create(
      {
        purchaseOrderId: po.id,
        receivedAt: "2026-09-10",
        lines: [{ purchaseOrderLineItemId: poLine.id, receivedQuantity: 10, stockMaterial: "tmt_steel" }],
      },
      TEST_ACTOR,
    );

    const trace = await stockAdapter.getTrace(projectId, "tmt_steel", "2026-09-10");
    expect(trace.tracedReceivedToday).toBe(10);
    expect(trace.tracedReceivedLineCount).toBe(1);
    expect(trace.tracedIssuedToday).toBe(0);
    expect(trace.tracedWastedToday).toBe(0);
  });

  it("leaves an untagged GRN line out of the trace — stockMaterial is opt-in, not inferred", async () => {
    const projectId = `proj_test_stock_untagged_${Math.random().toString(36).slice(2, 8)}`;
    const requisition = await createApprovedRequisition(projectId, 10);
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 50, requisition });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.decideLevel2(po.id, "approved", TEST_ACTOR);
    await purchaseOrdersAdapter.release(po.id, TEST_ACTOR);
    await purchaseOrdersAdapter.issue(po.id, TEST_ACTOR);

    const [poLine] = await purchaseOrdersAdapter.listLineItems(po.id);
    if (!poLine) throw new Error("Expected the issued PO to have at least one line item.");

    // No `stockMaterial` on this line — same as every GRN before this
    // correction shipped.
    await grnAdapter.create(
      { purchaseOrderId: po.id, receivedAt: "2026-09-11", lines: [{ purchaseOrderLineItemId: poLine.id, receivedQuantity: 10 }] },
      TEST_ACTOR,
    );

    const trace = await stockAdapter.getTrace(projectId, "tmt_steel", "2026-09-11");
    expect(trace.tracedReceivedToday).toBe(0);
    expect(trace.tracedReceivedLineCount).toBe(0);
  });

  it("traces an issued Store Requisition and a Wastage entry into getTrace's consumed figures", async () => {
    const projectId = `proj_test_stock_mr_${Math.random().toString(36).slice(2, 8)}`;
    const requisition = await storeRequisitionsAdapter.create(
      { projectId, requestDate: "2026-09-12", material: "cement", uom: "bag", requestedQuantity: 20 },
      TEST_ACTOR,
    );
    await storeRequisitionsAdapter.submit(requisition.id, TEST_ACTOR);
    await storeRequisitionsAdapter.decide(requisition.id, "approved", { approvedIssuedQuantity: 15 }, TEST_ACTOR);
    const issued = await storeRequisitionsAdapter.issue(requisition.id, TEST_ACTOR);
    if (!issued.issueDate) throw new Error("Expected issue() to set issueDate.");

    await wastageAdapter.create(
      { projectId, material: "cement", uom: "bag", quantity: 3, value: 900, recordedAt: `${issued.issueDate}T06:00:00.000Z` },
      TEST_ACTOR,
    );

    const trace = await stockAdapter.getTrace(projectId, "cement", issued.issueDate);
    expect(trace.tracedIssuedToday).toBe(15);
    expect(trace.tracedWastedToday).toBe(3);
    expect(trace.tracedReceivedToday).toBe(0);
  });

  it("returns every figure as 0 for a project/material/date with no GRN, Store Requisition, or Wastage activity at all", async () => {
    const projectId = `proj_test_stock_empty_${Math.random().toString(36).slice(2, 8)}`;
    const trace = await stockAdapter.getTrace(projectId, "paint", "2026-09-13");
    expect(trace.tracedReceivedToday).toBe(0);
    expect(trace.tracedReceivedLineCount).toBe(0);
    expect(trace.tracedIssuedToday).toBe(0);
    expect(trace.tracedWastedToday).toBe(0);
  });
});

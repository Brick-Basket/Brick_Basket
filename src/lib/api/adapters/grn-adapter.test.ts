import { describe, expect, it } from "vitest";
import { grnAdapter } from "./grn-adapter";
import { purchaseOrdersAdapter } from "./purchase-orders-adapter";
import { rfqAdapter } from "./rfq-adapter";
import { createApprovedRequisition, createIssuedPurchaseOrder, TEST_ACTOR } from "./test-fixtures";

describe("grnAdapter — receipt constraints", () => {
  it("records a receipt against an issued PO, snapshotting ordered quantity/rate from the PO line", async () => {
    const po = await createIssuedPurchaseOrder({ vendorId: "vendor_1", rate: 100 });
    const [poLine] = await purchaseOrdersAdapter.listLineItems(po.id);
    if (!poLine) throw new Error("Expected the issued PO to have at least one line item.");

    const grn = await grnAdapter.create(
      {
        purchaseOrderId: po.id,
        receivedAt: "2026-09-01",
        lines: [{ purchaseOrderLineItemId: poLine.id, receivedQuantity: poLine.quantity, brand: "Test Brand" }],
      },
      TEST_ACTOR,
    );
    expect(grn.purchaseOrderId).toBe(po.id);
    expect(grn.vendorId).toBe("vendor_1");

    const grnLines = await grnAdapter.listLineItems(grn.id);
    expect(grnLines).toHaveLength(1);
    expect(grnLines[0]!.orderedQuantity).toBe(poLine.quantity);
    expect(grnLines[0]!.rate).toBe(poLine.rate);
    expect(grnLines[0]!.receivedQuantity).toBe(poLine.quantity);
  });

  it("refuses to record a GRN against a PO that isn't issued yet", async () => {
    // A finalized RFQ + freshly-created PO that is deliberately left at
    // "draft" (never submitted/approved/released/issued) — the realistic
    // way to hit the issued-only guard.
    const requisition = await createApprovedRequisition("proj_luxury_villa", 50);
    const rfq = await rfqAdapter.create({ requisitionId: requisition.id }, TEST_ACTOR);
    const [line] = await rfqAdapter.listLines(rfq.id);
    if (!line) throw new Error("Expected the RFQ to have at least one line.");
    await rfqAdapter.setVendorQuote(rfq.id, line.id, "vendor_8", 60, TEST_ACTOR);
    await rfqAdapter.selectVendor(rfq.id, line.id, "vendor_8", TEST_ACTOR);
    const finalized = await rfqAdapter.finalize(rfq.id, TEST_ACTOR);
    const draftPo = await purchaseOrdersAdapter.create({ rfqId: finalized.id, vendorId: "vendor_8" }, TEST_ACTOR);

    await expect(
      grnAdapter.create({ purchaseOrderId: draftPo.id, receivedAt: "2026-09-01", lines: [] }, TEST_ACTOR),
    ).rejects.toThrow();
  });

  it("requires at least one received line", async () => {
    const po = await createIssuedPurchaseOrder({ vendorId: "vendor_5", rate: 80 });
    await expect(
      grnAdapter.create({ purchaseOrderId: po.id, receivedAt: "2026-09-01", lines: [] }, TEST_ACTOR),
    ).rejects.toThrow();
  });

  it("refuses a line whose purchaseOrderLineItemId doesn't belong to the given PO", async () => {
    const poA = await createIssuedPurchaseOrder({ vendorId: "vendor_6", rate: 90 });
    const poB = await createIssuedPurchaseOrder({ vendorId: "vendor_7", rate: 95 });
    const [lineFromB] = await purchaseOrdersAdapter.listLineItems(poB.id);
    if (!lineFromB) throw new Error("Expected PO B to have at least one line item.");

    await expect(
      grnAdapter.create(
        { purchaseOrderId: poA.id, receivedAt: "2026-09-01", lines: [{ purchaseOrderLineItemId: lineFromB.id, receivedQuantity: 10 }] },
        TEST_ACTOR,
      ),
    ).rejects.toThrow();
  });
});

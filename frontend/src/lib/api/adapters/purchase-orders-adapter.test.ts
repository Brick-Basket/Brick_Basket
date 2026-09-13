import { describe, expect, it } from "vitest";
import { purchaseOrdersAdapter } from "./purchase-orders-adapter";
import { createFinalizedRFQ, TEST_ACTOR } from "./test-fixtures";

describe("purchaseOrdersAdapter — L1 → L2 → release/issue workflow", () => {
  it("walks a draft PO through both approval levels to released and issued", async () => {
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 100 });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    expect(po.status).toBe("draft");

    const submitted = await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
    expect(submitted.status).toBe("pending_approval_l1");

    const l1 = await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);
    expect(l1.status).toBe("pending_approval_l2");

    const l2 = await purchaseOrdersAdapter.decideLevel2(po.id, "approved", TEST_ACTOR);
    expect(l2.status).toBe("approved");

    const released = await purchaseOrdersAdapter.release(po.id, TEST_ACTOR);
    expect(released.status).toBe("released");
    expect(released.releasedAt).not.toBeNull();

    const issued = await purchaseOrdersAdapter.issue(po.id, TEST_ACTOR);
    expect(issued.status).toBe("issued");
    expect(issued.issuedAt).not.toBeNull();
    expect(issued.emailDispatchStatus).toBe("sent");
  });

  it("records which level rejected the PO, and blocks release/issue on a rejected PO", async () => {
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 100 });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);

    const rejected = await purchaseOrdersAdapter.decideLevel1(po.id, "rejected", TEST_ACTOR, "Terms unclear");
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectedAtLevel).toBe(1);

    await expect(purchaseOrdersAdapter.release(po.id, TEST_ACTOR)).rejects.toThrow();
  });

  it("refuses to create a second PO from the same vendor's already-claimed RFQ lines", async () => {
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 100 });
    await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await expect(purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR)).rejects.toThrow();
  });

  it("refuses to release a PO that hasn't cleared both approval levels", async () => {
    const rfq = await createFinalizedRFQ({ vendorId: "vendor_1", rate: 100 });
    const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId: "vendor_1" }, TEST_ACTOR);
    await expect(purchaseOrdersAdapter.release(po.id, TEST_ACTOR)).rejects.toThrow();
  });
});

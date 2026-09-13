import { describe, expect, it } from "vitest";
import { mrcAdapter } from "./mrc-adapter";
import { grnAdapter } from "./grn-adapter";
import { purchaseOrdersAdapter } from "./purchase-orders-adapter";
import { createIssuedPurchaseOrder, TEST_ACTOR } from "./test-fixtures";

const CUSTOMER = { id: "u_test_customer", name: "Test Customer" };

describe("mrcAdapter — issue / customer response workflow", () => {
  it("issues a manually-entered MRC for customer acceptance, and records the customer's acceptance", async () => {
    const mrc = await mrcAdapter.create(
      {
        customerId: "cust_arjun_kapoor",
        projectId: "proj_luxury_villa",
        lines: [{ source: "manual", description: "Site-supplied sand", uom: "cum", quantity: 20, make: "Local" }],
      },
      TEST_ACTOR,
    );
    expect(mrc.status).toBe("draft");

    const issued = await mrcAdapter.issue(mrc.id, TEST_ACTOR);
    expect(issued.status).toBe("issued");
    expect(issued.issuedAt).not.toBeNull();

    const accepted = await mrcAdapter.respond(mrc.id, "accepted", CUSTOMER);
    expect(accepted.status).toBe("accepted");
    expect(accepted.respondedAt).not.toBeNull();
  });

  it("records a customer decline with a reason, and can be withdrawn back to draft from 'issued'", async () => {
    const mrc = await mrcAdapter.create(
      {
        customerId: "cust_arjun_kapoor",
        projectId: "proj_luxury_villa",
        lines: [{ source: "manual", description: "Site-supplied aggregate", uom: "cum", quantity: 15, make: "Local" }],
      },
      TEST_ACTOR,
    );
    await mrcAdapter.issue(mrc.id, TEST_ACTOR);
    const declined = await mrcAdapter.respond(mrc.id, "declined", CUSTOMER, "Quantity looks wrong");
    expect(declined.status).toBe("declined");
    expect(declined.declineReason).toBe("Quantity looks wrong");

    // A second, separate MRC exercises withdraw (declined MRCs aren't
    // "issued" any more, so withdraw's own guard needs an MRC still awaiting
    // a response).
    const mrc2 = await mrcAdapter.create(
      {
        customerId: "cust_arjun_kapoor",
        projectId: "proj_luxury_villa",
        lines: [{ source: "manual", description: "Site-supplied bricks", uom: "nos", quantity: 500, make: "Local" }],
      },
      TEST_ACTOR,
    );
    await mrcAdapter.issue(mrc2.id, TEST_ACTOR);
    const withdrawn = await mrcAdapter.withdraw(mrc2.id, TEST_ACTOR);
    expect(withdrawn.status).toBe("draft");
    expect(withdrawn.issuedAt).toBeNull();
  });

  it("caps a 'source: grn' line's certified quantity at what was actually received", async () => {
    const po = await createIssuedPurchaseOrder({ vendorId: "vendor_1", rate: 100 });
    const [poLine] = await purchaseOrdersAdapter.listLineItems(po.id);
    if (!poLine) throw new Error("Expected the issued PO to have at least one line item.");
    const grn = await grnAdapter.create(
      { purchaseOrderId: po.id, receivedAt: "2026-09-01", lines: [{ purchaseOrderLineItemId: poLine.id, receivedQuantity: 50 }] },
      TEST_ACTOR,
    );
    const [grnLine] = await grnAdapter.listLineItems(grn.id);
    if (!grnLine) throw new Error("Expected the GRN to have at least one line item.");

    await expect(
      mrcAdapter.create(
        { customerId: "cust_arjun_kapoor", lines: [{ source: "grn", grnLineItemId: grnLine.id, quantity: grnLine.receivedQuantity + 1 }] },
        TEST_ACTOR,
      ),
    ).rejects.toThrow();

    const mrc = await mrcAdapter.create(
      { customerId: "cust_arjun_kapoor", lines: [{ source: "grn", grnLineItemId: grnLine.id, quantity: grnLine.receivedQuantity }] },
      TEST_ACTOR,
    );
    const lines = await mrcAdapter.listLineItems(mrc.id);
    expect(lines[0]!.quantity).toBe(grnLine.receivedQuantity);
    expect(lines[0]!.make).toBe(grnLine.brand ?? "—");
  });

  it("requires a valid customer and at least one line to create an MRC", async () => {
    await expect(
      mrcAdapter.create({ customerId: "not_a_real_customer", lines: [{ source: "manual", description: "X", uom: "unit", quantity: 1, make: "Test" }] }, TEST_ACTOR),
    ).rejects.toThrow();

    await expect(mrcAdapter.create({ customerId: "cust_arjun_kapoor", lines: [] }, TEST_ACTOR)).rejects.toThrow();
  });
});

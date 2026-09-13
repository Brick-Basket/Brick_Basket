import { describe, expect, it } from "vitest";
import { storeRequisitionsAdapter } from "./store-requisitions-adapter";

const REQUESTER = { id: "u_test_pm", name: "Test PM" };
const STORES = { id: "u_test_store", name: "Test Store Personnel" };

describe("storeRequisitionsAdapter — draft → submit → approve/reject → issue workflow", () => {
  it("walks a draft MR through submit, approval (with an issuable quantity) and issuance", async () => {
    const mr = await storeRequisitionsAdapter.create(
      { projectId: "proj_luxury_villa", requestDate: "2026-09-01", material: "cement", uom: "bag (50kg)", requestedQuantity: 100 },
      REQUESTER,
    );
    expect(mr.status).toBe("draft");

    const submitted = await storeRequisitionsAdapter.submit(mr.id, REQUESTER);
    expect(submitted.status).toBe("submitted");

    const approved = await storeRequisitionsAdapter.decide(mr.id, "approved", { approvedIssuedQuantity: 90, storeRemarks: "10 bags held back" }, STORES);
    expect(approved.status).toBe("approved");
    expect(approved.approvedIssuedQuantity).toBe(90);

    const issued = await storeRequisitionsAdapter.issue(mr.id, STORES);
    expect(issued.status).toBe("issued");
    expect(issued.issueDate).not.toBeUndefined();
  });

  it("requires a positive approvedIssuedQuantity to approve, and allows rejecting with a reason", async () => {
    const mr = await storeRequisitionsAdapter.create(
      { projectId: "proj_luxury_villa", requestDate: "2026-09-01", material: "sand", uom: "cum", requestedQuantity: 10 },
      REQUESTER,
    );
    await storeRequisitionsAdapter.submit(mr.id, REQUESTER);

    await expect(storeRequisitionsAdapter.decide(mr.id, "approved", {}, STORES)).rejects.toThrow();

    const rejected = await storeRequisitionsAdapter.decide(mr.id, "rejected", { storeRemarks: "Out of stock" }, STORES);
    expect(rejected.status).toBe("rejected");
    expect(rejected.approvedIssuedQuantity).toBeUndefined();
  });

  it("refuses to issue an MR that hasn't been approved yet", async () => {
    const mr = await storeRequisitionsAdapter.create(
      { projectId: "proj_luxury_villa", requestDate: "2026-09-01", material: "bricks", uom: "nos", requestedQuantity: 500 },
      REQUESTER,
    );
    await storeRequisitionsAdapter.submit(mr.id, REQUESTER);
    await expect(storeRequisitionsAdapter.issue(mr.id, STORES)).rejects.toThrow();
  });

  it("requires a material name when material is 'other'", async () => {
    await expect(
      storeRequisitionsAdapter.create(
        { projectId: "proj_luxury_villa", requestDate: "2026-09-01", material: "other", uom: "unit", requestedQuantity: 1 },
        REQUESTER,
      ),
    ).rejects.toThrow();
  });
});

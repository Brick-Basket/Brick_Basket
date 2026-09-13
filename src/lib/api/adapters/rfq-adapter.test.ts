import { describe, expect, it } from "vitest";
import { rfqAdapter } from "./rfq-adapter";
import { requisitionsAdapter } from "./requisitions-adapter";
import { createApprovedRequisition, TEST_ACTOR } from "./test-fixtures";

describe("rfqAdapter — quote → comparison → finalize workflow", () => {
  it("builds comparison lines from an approved requisition, records vendor quotes, and finalizes once every line has a selected vendor", async () => {
    const requisition = await createApprovedRequisition();
    const rfq = await rfqAdapter.create({ requisitionId: requisition.id }, TEST_ACTOR);
    expect(rfq.status).toBe("draft");

    const lines = await rfqAdapter.listLines(rfq.id);
    expect(lines).toHaveLength(1);
    const [line] = lines;
    if (!line) throw new Error("Expected the RFQ to have at least one line.");

    await rfqAdapter.setVendorQuote(rfq.id, line.id, "vendor_1", 100, TEST_ACTOR);
    await rfqAdapter.setVendorQuote(rfq.id, line.id, "vendor_2", 90, TEST_ACTOR);
    const quotes = await rfqAdapter.listVendorQuotes(rfq.id);
    expect(quotes).toHaveLength(2);

    const selected = await rfqAdapter.selectVendor(rfq.id, line.id, "vendor_2", TEST_ACTOR);
    expect(selected.selectedVendorId).toBe("vendor_2");

    const finalized = await rfqAdapter.finalize(rfq.id, TEST_ACTOR);
    expect(finalized.status).toBe("finalized");
    expect(finalized.finalizedAt).not.toBeNull();
  });

  it("refuses to finalize while any line has no selected vendor", async () => {
    const requisition = await createApprovedRequisition();
    const rfq = await rfqAdapter.create({ requisitionId: requisition.id }, TEST_ACTOR);
    await expect(rfqAdapter.finalize(rfq.id, TEST_ACTOR)).rejects.toThrow();
  });

  it("caps vendor quotes at 3 distinct vendors per line", async () => {
    const requisition = await createApprovedRequisition();
    const rfq = await rfqAdapter.create({ requisitionId: requisition.id }, TEST_ACTOR);
    const [line] = await rfqAdapter.listLines(rfq.id);
    if (!line) throw new Error("Expected the RFQ to have at least one line.");

    await rfqAdapter.setVendorQuote(rfq.id, line.id, "vendor_1", 100, TEST_ACTOR);
    await rfqAdapter.setVendorQuote(rfq.id, line.id, "vendor_2", 95, TEST_ACTOR);
    await rfqAdapter.setVendorQuote(rfq.id, line.id, "vendor_3", 98, TEST_ACTOR);
    await expect(rfqAdapter.setVendorQuote(rfq.id, line.id, "vendor_4", 97, TEST_ACTOR)).rejects.toThrow();
  });

  it("only allows creating an RFQ from an approved requisition, and refuses a second RFQ for the same requisition", async () => {
    const draft = await requisitionsAdapter.create(
      { projectId: "proj_luxury_villa", lines: [{ source: "additional", description: "X", uom: "unit", quantity: 1 }] },
      TEST_ACTOR,
    );
    await expect(rfqAdapter.create({ requisitionId: draft.id }, TEST_ACTOR)).rejects.toThrow();

    const requisition = await createApprovedRequisition();
    await rfqAdapter.create({ requisitionId: requisition.id }, TEST_ACTOR);
    await expect(rfqAdapter.create({ requisitionId: requisition.id }, TEST_ACTOR)).rejects.toThrow();
  });
});

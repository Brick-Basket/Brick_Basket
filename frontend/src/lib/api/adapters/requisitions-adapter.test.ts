import { describe, expect, it } from "vitest";
import { requisitionsAdapter } from "./requisitions-adapter";

const REQUESTER = { id: "u_test_pm", name: "Test PM" };
const APPROVER = { id: "u_test_admin", name: "Test Admin" };

describe("requisitionsAdapter — submit → approve/reject workflow", () => {
  it("approves a submitted requisition", async () => {
    const req = await requisitionsAdapter.create(
      {
        projectId: "proj_luxury_villa",
        notes: "Test",
        lines: [{ source: "predefined", aceItemId: "ace_1", description: "TMT Steel (Fe 500), 12mm", uom: "kg", quantity: 200 }],
      },
      REQUESTER,
    );
    expect(req.status).toBe("draft");

    const submitted = await requisitionsAdapter.submit(req.id, REQUESTER);
    expect(submitted.status).toBe("submitted");
    expect(submitted.submittedAt).not.toBeNull();

    const approved = await requisitionsAdapter.decide(req.id, "approved", APPROVER);
    expect(approved.status).toBe("approved");
    expect(approved.decidedAt).not.toBeNull();
    expect(approved.rejectReason).toBeNull();
  });

  it("rejects a submitted requisition with a reason, and allows revising it back to draft", async () => {
    const req = await requisitionsAdapter.create(
      { projectId: "proj_luxury_villa", lines: [{ source: "additional", description: "Custom item", uom: "unit", quantity: 5 }] },
      REQUESTER,
    );
    await requisitionsAdapter.submit(req.id, REQUESTER);

    const rejected = await requisitionsAdapter.decide(req.id, "rejected", APPROVER, "Not needed yet");
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectReason).toBe("Not needed yet");

    const revised = await requisitionsAdapter.update(req.id, { notes: "Revised" }, REQUESTER);
    expect(revised.status).toBe("draft");
    expect(revised.rejectReason).toBeNull();
  });

  it("refuses to decide a requisition that isn't currently awaiting review", async () => {
    const req = await requisitionsAdapter.create(
      { projectId: "proj_luxury_villa", lines: [{ source: "additional", description: "X", uom: "unit", quantity: 1 }] },
      REQUESTER,
    );
    // Still "draft" — never submitted.
    await expect(requisitionsAdapter.decide(req.id, "approved", APPROVER)).rejects.toThrow();
  });
});

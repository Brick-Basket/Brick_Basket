import { requisitionsAdapter } from "@/lib/api/adapters/requisitions-adapter";
import { rfqAdapter } from "@/lib/api/adapters/rfq-adapter";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";
import type { PurchaseRequisition } from "@/types/domain/requisition";
import type { RFQ } from "@/types/domain/rfq";
import type { PurchaseOrder } from "@/types/domain/purchase-order";

/**
 * Shared, non-test fixture builders for adapter workflow tests (BrickBasket
 * final hardening pass — P1 TESTING). This file is deliberately named so it
 * does NOT match vitest's `include: ["src/**\/*.{test,spec}.{ts,tsx}"]`
 * pattern — it is a helper module, not a test suite of its own.
 *
 * Each builder composes the real adapters' own public `create`/`submit`/
 * `decide`/`finalize`/etc. methods — never a mock array directly — the same
 * cross-adapter composition discipline the adapters themselves already
 * follow (`RFQAdapter.create` calling `requisitionsAdapter`, e.g.). This
 * keeps the fixtures honest: a test building "an issued Purchase Order"
 * actually walks the full Requisition → RFQ → PO state machine exactly as a
 * real user would, so a workflow test exercises the same guardrails
 * (approved-only, finalized-only, issued-only, ...) it would in the app.
 *
 * Every call creates a brand-new entity — none of these depend on any
 * specific mock-data record's current status, so tests stay independent of
 * both mock-data changes and each other's side effects within a shared
 * Vitest module (adapter singletons persist state across `it()` blocks in
 * the same test file, per Vitest's per-file module isolation).
 */

export const TEST_ACTOR = { id: "u_test_actor", name: "Test Actor" };

/** A fresh Purchase Requisition, created → submitted → approved. One "predefined" line against `ace_1` (civil, TMT Steel) unless overridden. */
export async function createApprovedRequisition(
  projectId = "proj_luxury_villa",
  quantity = 500,
): Promise<PurchaseRequisition> {
  const created = await requisitionsAdapter.create(
    {
      projectId,
      notes: "Test fixture requisition (adapter workflow tests)",
      lines: [
        { source: "predefined", aceItemId: "ace_1", description: "TMT Steel (Fe 500), 12mm", uom: "kg", quantity },
      ],
    },
    TEST_ACTOR,
  );
  await requisitionsAdapter.submit(created.id, TEST_ACTOR);
  return requisitionsAdapter.decide(created.id, "approved", TEST_ACTOR);
}

/** A fresh finalized RFQ — created from a (by default freshly-built) approved requisition, quoted and vendor-selected on every line. */
export async function createFinalizedRFQ(
  options: { vendorId?: string; rate?: number; requisition?: PurchaseRequisition } = {},
): Promise<RFQ> {
  const vendorId = options.vendorId ?? "vendor_1";
  const rate = options.rate ?? 100;
  const requisition = options.requisition ?? (await createApprovedRequisition());
  const rfq = await rfqAdapter.create({ requisitionId: requisition.id }, TEST_ACTOR);
  const lines = await rfqAdapter.listLines(rfq.id);
  for (const line of lines) {
    await rfqAdapter.setVendorQuote(rfq.id, line.id, vendorId, rate, TEST_ACTOR);
    await rfqAdapter.selectVendor(rfq.id, line.id, vendorId, TEST_ACTOR);
  }
  return rfqAdapter.finalize(rfq.id, TEST_ACTOR);
}

/** A fresh Purchase Order, walked all the way through to `issued` (L1 → L2 → release → issue). */
export async function createIssuedPurchaseOrder(options: { vendorId?: string; rate?: number } = {}): Promise<PurchaseOrder> {
  const vendorId = options.vendorId ?? "vendor_1";
  const rfq = await createFinalizedRFQ({ vendorId, rate: options.rate });
  const po = await purchaseOrdersAdapter.create({ rfqId: rfq.id, vendorId }, TEST_ACTOR);
  await purchaseOrdersAdapter.submit(po.id, TEST_ACTOR);
  await purchaseOrdersAdapter.decideLevel1(po.id, "approved", TEST_ACTOR);
  await purchaseOrdersAdapter.decideLevel2(po.id, "approved", TEST_ACTOR);
  await purchaseOrdersAdapter.release(po.id, TEST_ACTOR);
  return purchaseOrdersAdapter.issue(po.id, TEST_ACTOR);
}

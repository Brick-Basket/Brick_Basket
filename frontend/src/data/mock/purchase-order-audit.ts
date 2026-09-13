import type { PurchaseOrderAuditEntry } from "@/types/domain/purchase-order-audit";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/purchase-orders-adapter.ts. Mirrors each mock PO's
 * full history exactly as `MockPurchaseOrdersAdapter`'s mutating methods
 * would have appended it.
 */
export const mockPurchaseOrderAudit: PurchaseOrderAuditEntry[] = [
  // po_1 — full lifecycle: created → submitted → approved L1 → approved L2 → released → issued
  { id: "poaud_1", purchaseOrderId: "po_1", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-07-11T05:00:00.000Z" },
  { id: "poaud_2", purchaseOrderId: "po_1", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-07-11T06:00:00.000Z" },
  { id: "poaud_3", purchaseOrderId: "po_1", action: "approved_level1", message: "Approved at level 1 by Ananya Gupta.", actorId: "u_finance", actorName: "Ananya Gupta", createdAt: "2026-07-12T08:00:00.000Z" },
  { id: "poaud_4", purchaseOrderId: "po_1", action: "approved_level2", message: "Approved at level 2 by Rajesh Kumar.", actorId: "u_approver", actorName: "Rajesh Kumar", createdAt: "2026-07-13T08:00:00.000Z" },
  { id: "poaud_5", purchaseOrderId: "po_1", action: "released", message: "Released.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-07-14T05:00:00.000Z" },
  { id: "poaud_6", purchaseOrderId: "po_1", action: "issued", message: "Issued to vendor — email dispatched.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-07-14T06:00:00.000Z" },

  // po_2 — created → submitted → rejected at level 1
  { id: "poaud_7", purchaseOrderId: "po_2", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-07-11T05:15:00.000Z" },
  { id: "poaud_8", purchaseOrderId: "po_2", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-07-12T06:00:00.000Z" },
  {
    id: "poaud_9",
    purchaseOrderId: "po_2",
    action: "rejected",
    message: "Rejected at level 1 by Ananya Gupta: Vendor rate is not the lowest quoted (L1) and no justification was recorded — re-select or justify before resubmitting.",
    actorId: "u_finance",
    actorName: "Ananya Gupta",
    createdAt: "2026-07-13T09:00:00.000Z",
  },

  // po_3 — created → submitted → approved at level 1 (awaiting level 2)
  { id: "poaud_10", purchaseOrderId: "po_3", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-21T05:00:00.000Z" },
  { id: "poaud_11", purchaseOrderId: "po_3", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-21T06:00:00.000Z" },
  { id: "poaud_12", purchaseOrderId: "po_3", action: "approved_level1", message: "Approved at level 1 by Ananya Gupta.", actorId: "u_finance", actorName: "Ananya Gupta", createdAt: "2026-08-22T08:00:00.000Z" },

  // po_4 — created only (draft)
  { id: "poaud_13", purchaseOrderId: "po_4", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-21T05:30:00.000Z" },
];

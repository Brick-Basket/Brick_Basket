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

  // po_5 — full lifecycle: created → submitted → approved L1 → approved L2 → released → issued (Riverside Apartments)
  { id: "poaud_14", purchaseOrderId: "po_5", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-26T05:00:00.000Z" },
  { id: "poaud_15", purchaseOrderId: "po_5", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-26T06:00:00.000Z" },
  { id: "poaud_16", purchaseOrderId: "po_5", action: "approved_level1", message: "Approved at level 1 by Ananya Gupta.", actorId: "u_finance", actorName: "Ananya Gupta", createdAt: "2026-08-27T08:00:00.000Z" },
  { id: "poaud_17", purchaseOrderId: "po_5", action: "approved_level2", message: "Approved at level 2 by Rajesh Kumar.", actorId: "u_approver", actorName: "Rajesh Kumar", createdAt: "2026-08-28T08:00:00.000Z" },
  { id: "poaud_18", purchaseOrderId: "po_5", action: "released", message: "Released.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-29T05:00:00.000Z" },
  { id: "poaud_19", purchaseOrderId: "po_5", action: "issued", message: "Issued to vendor — email dispatched.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-29T06:00:00.000Z" },

  // po_6 — created → submitted only, still awaiting level 1 (Riverside Apartments)
  { id: "poaud_20", purchaseOrderId: "po_6", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-26T05:15:00.000Z" },
  { id: "poaud_21", purchaseOrderId: "po_6", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-27T06:00:00.000Z" },

  // po_7 — created → submitted → rejected at level 1 (Heritage Resort)
  { id: "poaud_22", purchaseOrderId: "po_7", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-02T05:15:00.000Z" },
  { id: "poaud_23", purchaseOrderId: "po_7", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-03T06:00:00.000Z" },
  {
    id: "poaud_24",
    purchaseOrderId: "po_7",
    action: "rejected",
    message: "Rejected at level 1 by Ananya Gupta: Vendor rate exceeds the approved budget line for this item — re-negotiate or re-select before resubmitting.",
    actorId: "u_finance",
    actorName: "Ananya Gupta",
    createdAt: "2026-08-04T09:00:00.000Z",
  },

  // po_8 — full lifecycle (Heritage Resort)
  { id: "poaud_25", purchaseOrderId: "po_8", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-02T05:30:00.000Z" },
  { id: "poaud_26", purchaseOrderId: "po_8", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-03T06:30:00.000Z" },
  { id: "poaud_27", purchaseOrderId: "po_8", action: "approved_level1", message: "Approved at level 1 by Ananya Gupta.", actorId: "u_finance", actorName: "Ananya Gupta", createdAt: "2026-08-05T08:00:00.000Z" },
  { id: "poaud_28", purchaseOrderId: "po_8", action: "approved_level2", message: "Approved at level 2 by Rajesh Kumar.", actorId: "u_approver", actorName: "Rajesh Kumar", createdAt: "2026-08-06T08:00:00.000Z" },
  { id: "poaud_29", purchaseOrderId: "po_8", action: "released", message: "Released.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-07T05:00:00.000Z" },
  { id: "poaud_30", purchaseOrderId: "po_8", action: "issued", message: "Issued to vendor — email dispatched.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-07T06:00:00.000Z" },

  // po_9 — full lifecycle (Gorakhpur Business Park)
  { id: "poaud_31", purchaseOrderId: "po_9", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-09-19T05:00:00.000Z" },
  { id: "poaud_32", purchaseOrderId: "po_9", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-09-19T06:00:00.000Z" },
  { id: "poaud_33", purchaseOrderId: "po_9", action: "approved_level1", message: "Approved at level 1 by Ananya Gupta.", actorId: "u_finance", actorName: "Ananya Gupta", createdAt: "2026-09-20T08:00:00.000Z" },
  { id: "poaud_34", purchaseOrderId: "po_9", action: "approved_level2", message: "Approved at level 2 by Rajesh Kumar.", actorId: "u_approver", actorName: "Rajesh Kumar", createdAt: "2026-09-21T08:00:00.000Z" },
  { id: "poaud_35", purchaseOrderId: "po_9", action: "released", message: "Released.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-09-22T05:00:00.000Z" },
  { id: "poaud_36", purchaseOrderId: "po_9", action: "issued", message: "Issued to vendor — email dispatched.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-09-22T06:00:00.000Z" },

  // po_10 — created → submitted → approved L1 → approved L2 → released, still awaiting issue (Gorakhpur Business Park)
  { id: "poaud_37", purchaseOrderId: "po_10", action: "created", message: "Purchase Order created from finalized RFQ.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-09-19T05:15:00.000Z" },
  { id: "poaud_38", purchaseOrderId: "po_10", action: "submitted", message: "Submitted for level 1 approval.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-09-19T06:15:00.000Z" },
  { id: "poaud_39", purchaseOrderId: "po_10", action: "approved_level1", message: "Approved at level 1 by Ananya Gupta.", actorId: "u_finance", actorName: "Ananya Gupta", createdAt: "2026-09-20T08:30:00.000Z" },
  { id: "poaud_40", purchaseOrderId: "po_10", action: "approved_level2", message: "Approved at level 2 by Rajesh Kumar.", actorId: "u_approver", actorName: "Rajesh Kumar", createdAt: "2026-09-22T08:00:00.000Z" },
  { id: "poaud_41", purchaseOrderId: "po_10", action: "released", message: "Released.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-09-23T05:00:00.000Z" },
];

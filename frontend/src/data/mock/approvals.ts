import type { Approval } from "@/types/domain/approval";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/purchase-orders-adapter.ts. Uses the same demo
 * personas as `src/lib/auth/mock-users.ts`'s `finance` (Ananya Gupta,
 * level 1) and `approver` (Rajesh Kumar, level 2) roles.
 */
export const mockApprovals: Approval[] = [
  { id: "appr_1", purchaseOrderId: "po_1", level: 1, decision: "approved", decidedBy: "u_finance", decidedByName: "Ananya Gupta", decidedAt: "2026-07-12T08:00:00.000Z" },
  {
    id: "appr_2",
    purchaseOrderId: "po_1",
    level: 2,
    decision: "approved",
    decidedBy: "u_approver",
    decidedByName: "Rajesh Kumar",
    comment: "Approved — proceed to release.",
    decidedAt: "2026-07-13T08:00:00.000Z",
  },
  {
    id: "appr_3",
    purchaseOrderId: "po_2",
    level: 1,
    decision: "rejected",
    decidedBy: "u_finance",
    decidedByName: "Ananya Gupta",
    comment: "Vendor rate is not the lowest quoted (L1) and no justification was recorded — re-select or justify before resubmitting.",
    decidedAt: "2026-07-13T09:00:00.000Z",
  },
  { id: "appr_4", purchaseOrderId: "po_3", level: 1, decision: "approved", decidedBy: "u_finance", decidedByName: "Ananya Gupta", decidedAt: "2026-08-22T08:00:00.000Z" },

  // po_5–8 — Riverside Apartments/Heritage Resort (po_6 is still awaiting a
  // level 1 decision, so it has no approval entry yet)
  { id: "appr_5", purchaseOrderId: "po_5", level: 1, decision: "approved", decidedBy: "u_finance", decidedByName: "Ananya Gupta", decidedAt: "2026-08-27T08:00:00.000Z" },
  {
    id: "appr_6",
    purchaseOrderId: "po_5",
    level: 2,
    decision: "approved",
    decidedBy: "u_approver",
    decidedByName: "Rajesh Kumar",
    comment: "Approved — proceed to release.",
    decidedAt: "2026-08-28T08:00:00.000Z",
  },
  {
    id: "appr_7",
    purchaseOrderId: "po_7",
    level: 1,
    decision: "rejected",
    decidedBy: "u_finance",
    decidedByName: "Ananya Gupta",
    comment: "Vendor rate exceeds the approved budget line for this item — re-negotiate or re-select before resubmitting.",
    decidedAt: "2026-08-04T09:00:00.000Z",
  },
  { id: "appr_8", purchaseOrderId: "po_8", level: 1, decision: "approved", decidedBy: "u_finance", decidedByName: "Ananya Gupta", decidedAt: "2026-08-05T08:00:00.000Z" },
  {
    id: "appr_9",
    purchaseOrderId: "po_8",
    level: 2,
    decision: "approved",
    decidedBy: "u_approver",
    decidedByName: "Rajesh Kumar",
    comment: "Approved — proceed to release.",
    decidedAt: "2026-08-06T08:00:00.000Z",
  },

  // po_9/po_10 — Gorakhpur Business Park (both fully approved; po_10 is
  // released but not yet issued, see mock/purchase-orders.ts)
  { id: "appr_10", purchaseOrderId: "po_9", level: 1, decision: "approved", decidedBy: "u_finance", decidedByName: "Ananya Gupta", decidedAt: "2026-09-20T08:00:00.000Z" },
  {
    id: "appr_11",
    purchaseOrderId: "po_9",
    level: 2,
    decision: "approved",
    decidedBy: "u_approver",
    decidedByName: "Rajesh Kumar",
    comment: "Approved — proceed to release.",
    decidedAt: "2026-09-21T08:00:00.000Z",
  },
  { id: "appr_12", purchaseOrderId: "po_10", level: 1, decision: "approved", decidedBy: "u_finance", decidedByName: "Ananya Gupta", decidedAt: "2026-09-20T08:30:00.000Z" },
  {
    id: "appr_13",
    purchaseOrderId: "po_10",
    level: 2,
    decision: "approved",
    decidedBy: "u_approver",
    decidedByName: "Rajesh Kumar",
    comment: "Approved — proceed to release.",
    decidedAt: "2026-09-22T08:00:00.000Z",
  },
];

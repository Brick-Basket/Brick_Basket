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
];

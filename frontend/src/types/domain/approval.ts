/**
 * One level-decision on a Purchase Order's two-level approval workflow
 * (Part 10) — feeds `ApprovalTimeline`. Kept as its own append-only entity,
 * separate from `PurchaseOrderAuditEntry`: the owner requirements list
 * "two-level approval" and "Audit trail" as two distinct required items, so
 * this frontend models the approval decisions themselves separately from
 * the general activity log (which also records submit/release/issue).
 */
export type ApprovalLevel = 1 | 2;
export type ApprovalDecision = "approved" | "rejected";

export interface Approval {
  id: string;
  purchaseOrderId: string;
  level: ApprovalLevel;
  decision: ApprovalDecision;
  decidedBy: string;
  decidedByName: string;
  comment?: string;
  decidedAt: string;
}

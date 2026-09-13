/** The "Audit trail" explicitly required by the Purchase Order module — same append-only-log pattern as `RequisitionAuditEntry`/`ContractAuditEntry`. */
export type PurchaseOrderAuditAction =
  | "created"
  | "updated"
  | "submitted"
  | "approved_level1"
  | "approved_level2"
  | "rejected"
  | "released"
  | "issued";

export interface PurchaseOrderAuditEntry {
  id: string;
  purchaseOrderId: string;
  action: PurchaseOrderAuditAction;
  message: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}

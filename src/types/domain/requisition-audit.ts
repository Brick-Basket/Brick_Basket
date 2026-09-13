/** The "History" required by the Purchase/Material Requisition module — same append-only-log pattern as ContractAuditEntry. */
export type RequisitionAuditAction = "created" | "updated" | "submitted" | "approved" | "rejected";

export interface RequisitionAuditEntry {
  id: string;
  requisitionId: string;
  action: RequisitionAuditAction;
  message: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}

import type { RequisitionAuditEntry } from "@/types/domain/requisition-audit";

/** Mock/demo dataset only — never imported outside src/lib/api/adapters/requisitions-adapter.ts. Matches mockRequisitions' statuses 1:1. */
export const mockRequisitionAudit: RequisitionAuditEntry[] = [
  { id: "raud_1", requisitionId: "req_1", action: "created", message: "Requisition created.", actorId: "u_pm", actorName: "Karan Mehta", createdAt: "2026-08-28T05:00:00.000Z" },

  { id: "raud_2", requisitionId: "req_2", action: "created", message: "Requisition created.", actorId: "u_pm", actorName: "Karan Mehta", createdAt: "2026-08-27T05:00:00.000Z" },
  { id: "raud_3", requisitionId: "req_2", action: "submitted", message: "Submitted for review.", actorId: "u_pm", actorName: "Karan Mehta", createdAt: "2026-08-29T06:00:00.000Z" },

  { id: "raud_4", requisitionId: "req_3", action: "created", message: "Requisition created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-08-04T05:00:00.000Z" },
  { id: "raud_5", requisitionId: "req_3", action: "submitted", message: "Submitted for review.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-08-05T06:00:00.000Z" },
  { id: "raud_6", requisitionId: "req_3", action: "approved", message: "Approved by Vikram Nair.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-08-06T09:00:00.000Z" },

  { id: "raud_7", requisitionId: "req_4", action: "created", message: "Requisition created.", actorId: "u_pm", actorName: "Karan Mehta", createdAt: "2026-07-19T05:00:00.000Z" },
  { id: "raud_8", requisitionId: "req_4", action: "submitted", message: "Submitted for review.", actorId: "u_pm", actorName: "Karan Mehta", createdAt: "2026-07-20T06:00:00.000Z" },
  {
    id: "raud_9",
    requisitionId: "req_4",
    action: "rejected",
    message: "Rejected by Aditi Sharma: Quantity exceeds this month's approved procurement plan — resubmit with a phased quantity.",
    actorId: "u_admin",
    actorName: "Aditi Sharma",
    createdAt: "2026-07-21T08:00:00.000Z",
  },

  { id: "raud_10", requisitionId: "req_5", action: "created", message: "Requisition created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-08-29T05:00:00.000Z" },
  { id: "raud_11", requisitionId: "req_5", action: "submitted", message: "Submitted for review.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-08-30T06:00:00.000Z" },

  { id: "raud_12", requisitionId: "req_6", action: "created", message: "Requisition created.", actorId: "u_pm", actorName: "Karan Mehta", createdAt: "2026-06-30T05:00:00.000Z" },
  { id: "raud_13", requisitionId: "req_6", action: "submitted", message: "Submitted for review.", actorId: "u_pm", actorName: "Karan Mehta", createdAt: "2026-07-01T06:00:00.000Z" },
  { id: "raud_14", requisitionId: "req_6", action: "approved", message: "Approved by Vikram Nair.", actorId: "u_purchaser", actorName: "Vikram Nair", createdAt: "2026-07-02T07:00:00.000Z" },
];

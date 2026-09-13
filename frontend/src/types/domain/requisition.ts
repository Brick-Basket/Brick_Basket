/**
 * Purchase / Material Requisition (Part 8) — "Project Manager and Admin
 * can raise material requirements," flowing next to admin/purchaser for
 * review (RFQ Management, Part 9, owns what happens after approval).
 *
 * **CONFIGURABLE — pending confirmation, see docs/OPEN_QUESTIONS.md #3
 * and #29.** The owner requirements list "Draft/submitted/approved/
 * rejected-style states only if configurable" without confirming the
 * vocabulary or who approves — this frontend implements a minimal
 * single-step review (not a two-level approval like Purchase Orders,
 * Part 10) so the module is exercisable end to end. See
 * `docs/WORKFLOWS.md`.
 */
export type PurchaseRequisitionStatus = "draft" | "submitted" | "approved" | "rejected";

export interface PurchaseRequisition {
  id: string;
  requisitionNumber: string;
  projectId: string;
  /** "Requester context" — the Project Manager or Admin who raised this requisition. */
  requestedBy: string;
  requestedByName: string;
  status: PurchaseRequisitionStatus;
  notes?: string;
  submittedAt: string | null;
  decidedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreatePurchaseRequisitionInput = {
  projectId: string;
  notes?: string;
  lines: Omit<MaterialRequirement, "id" | "requisitionId">[];
};

export type UpdatePurchaseRequisitionInput = {
  notes?: string;
  lines?: Omit<MaterialRequirement, "id" | "requisitionId">[];
};

/**
 * One line of a requisition — "item description, UOM, quantity and
 * brand" per the Supply Chain Management purpose statement.
 * `source`/`aceItemId` distinguish the two entry paths the owner
 * requirements name explicitly: "predefined item list" (picked from that
 * project's `ACEItem`s — the ACE → Requisition reference Part 8 asks to
 * wire) vs. "additional item entry" (free text, no ACE link).
 */
export interface MaterialRequirement {
  id: string;
  requisitionId: string;
  source: "predefined" | "additional";
  /** Set only when `source === "predefined"` — the `ACEItem` this line was picked from. */
  aceItemId?: string;
  description: string;
  uom: string;
  quantity: number;
  brand?: string;
}

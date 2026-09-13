/**
 * Purchase Orders (Part 10) — "Purchaser selects finalized/L1 vendor.
 * Generate PO with terms & conditions. Two-level approval workflow.
 * Release state, Issue state, email dispatch, audit trail." The next and
 * final step in the procurement chain documented in
 * `docs/ARCHITECTURE.md`'s cross-module data flow:
 * `ACE → Requisition → RFQ → Vendor Quotes → Comparison/L1 → PO`.
 *
 * **One PO per distinct vendor within a finalized RFQ, not one PO per
 * RFQ** — a **FRONTEND IMPLEMENTATION DECISION**, see
 * `docs/OPEN_QUESTIONS.md` #31. The owner's "Purchaser selects
 * finalized/L1 vendor" language is singular/vendor-scoped, and RFQ
 * Management (Part 9) already models vendor selection per line
 * (`RFQLine.selectedVendorId`), so a single finalized RFQ can have several
 * different selected vendors across its lines. A given `RFQLine` can
 * belong to at most one Purchase Order — enforced by
 * `PurchaseOrdersAdapter.create`.
 *
 * **CONFIGURABLE — pending confirmation, see docs/OPEN_QUESTIONS.md #3 and
 * #31.** The owner names "two-level approval," "Release state" and "Issue
 * state" as three separate milestones without confirming who decides each
 * one or the exact status vocabulary — this frontend implements a 7-state
 * machine below, keyed off the `po:approve:level1` / `po:approve:level2` /
 * `po:issue` permissions already defined in Part 3.
 */
export type PurchaseOrderStatus =
  | "draft"
  | "pending_approval_l1"
  | "pending_approval_l2"
  | "approved"
  | "rejected"
  | "released"
  | "issued";

/**
 * "Email dispatch status placeholder" per the owner requirements — a field
 * a real email service would update asynchronously after `issue()` sends
 * the PO to the vendor. Mocked as immediately `"sent"` the moment a PO is
 * issued (see `PurchaseOrdersAdapter.issue`) — a **FRONTEND IMPLEMENTATION
 * DECISION**, see `docs/OPEN_QUESTIONS.md` #31.
 */
export type EmailDispatchStatus = "not_sent" | "sent" | "failed";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  /** The finalized RFQ this PO's vendor group was created from. */
  rfqId: string;
  /** Denormalized from the RFQ at creation time (never a live join) — see `docs/DATA_MODELS.md`'s field typing conventions. */
  requisitionId: string;
  projectId: string;
  /** The single vendor this PO is issued to — every line item below was that vendor's selected quote on the source RFQ. */
  vendorId: string;
  status: PurchaseOrderStatus;
  /** Set only when `status === "rejected"` — which approval level rejected it, so the UI (and a revision) knows which decision to re-request. */
  rejectedAtLevel: 1 | 2 | null;
  /** "Generate PO with terms & conditions" — free text, editable while draft or rejected. */
  termsAndConditions: string;
  /** Snapshot of the source RFQ's `taxPercent` at creation time — editable while draft or rejected, same pattern as `RFQ.taxPercent`. */
  taxPercent: number;
  /** The purchaser/admin who created this PO. */
  preparedBy: string;
  preparedByName: string;
  submittedAt: string | null;
  releasedAt: string | null;
  issuedAt: string | null;
  emailDispatchStatus: EmailDispatchStatus;
  emailDispatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreatePurchaseOrderInput = {
  rfqId: string;
  vendorId: string;
  termsAndConditions?: string;
};

export type UpdatePurchaseOrderInput = {
  termsAndConditions?: string;
  taxPercent?: number;
};

/**
 * One line item of a PO — one per `RFQLine` in this PO's vendor group.
 * `rate` is a **snapshot** of that vendor's `RFQVendorQuote.rate` at
 * PO-creation time (never a live reference, same pattern as `RFQLine.aceRate`
 * and `DocumentVersion`); amount/total are always computed at render time
 * from `rate × quantity` plus the PO's `taxPercent`, never stored — see
 * `docs/DATA_MODELS.md`'s field typing conventions.
 */
export interface PurchaseOrderLineItem {
  id: string;
  purchaseOrderId: string;
  /** Traces back to the RFQ comparison row this line came from — `RFQLine.id`. */
  rfqLineId: string;
  description: string;
  uom: string;
  quantity: number;
  rate: number;
}

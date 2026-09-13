/**
 * RFQ Management (Part 9) — "Requisition flows to admin/purchaser.
 * Purchaser reviews vendor quotes and prepares comparison statement."
 * One RFQ is created from exactly one *approved* `PurchaseRequisition`
 * (Part 8) — the next step in the procurement chain documented in
 * `docs/ARCHITECTURE.md`'s cross-module data flow:
 * `ACE → Requisition → RFQ → Vendor Quotes → Comparison/L1 → PO (Part 10)`.
 *
 * **CONFIGURABLE — pending confirmation, see docs/OPEN_QUESTIONS.md #3 and
 * #30.** The owner requirements name "Approval/readiness state" without a
 * vocabulary — this frontend implements a minimal two-state
 * draft→finalized readiness flag (not a multi-step approval like Purchase
 * Orders' two-level approval, Part 10), matching the "L1 highlighting is a
 * *computed* UI state" framing: the comparison itself isn't an approval
 * workflow, only the final "lock it in and move to PO" step is.
 */
export type RFQStatus = "draft" | "finalized";

export interface RFQ {
  id: string;
  rfqNumber: string;
  /** The approved requisition this RFQ was created from — one RFQ per requisition, never many. */
  requisitionId: string;
  /** Denormalized from the requisition at creation time (never a live join) — see `docs/DATA_MODELS.md`'s field typing conventions. */
  projectId: string;
  status: RFQStatus;
  /**
   * "Tax as applicable" — a single applicable tax rate (e.g. GST %) for
   * this RFQ's comparison statement. The owner text doesn't specify a
   * per-line tax, so one RFQ-level rate is applied to every line's
   * computed total — a **FRONTEND IMPLEMENTATION DECISION**, see
   * `docs/OPEN_QUESTIONS.md` #30.
   */
  taxPercent: number;
  /** The purchaser/admin who created this RFQ and prepares the comparison. */
  preparedBy: string;
  preparedByName: string;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateRFQInput = {
  requisitionId: string;
  /** Defaults to a demo rate (18, i.e. GST 18%) when omitted — see `RFQAdapter.create`. */
  taxPercent?: number;
};

export type UpdateRFQInput = {
  taxPercent?: number;
};

/**
 * One row of the required comparison table — one per requisition line
 * this RFQ was created from. `aceRate` is a **snapshot** of that line's
 * `ACEItem.rate` at RFQ-creation time (never a live reference, same
 * pattern as `DocumentVersion`) — `null` when the source requisition line
 * was an `"additional"` free-entry item with no ACE reference, so "%
 * savings over ACE" has no baseline for that row.
 */
export interface RFQLine {
  id: string;
  rfqId: string;
  /** Traces back to the requisition line this row was pulled from — `PurchaseRequisition.MaterialRequirement.id`. */
  materialRequirementId: string;
  description: string;
  uom: string;
  quantity: number;
  /** Set only when the source line was `"predefined"` — the `ACEItem` this row is compared against. */
  aceItemId?: string;
  aceRate: number | null;
  /**
   * "Vendor selection" — the vendor chosen for this line. Not required to
   * be the L1 (lowest-rate) vendor: L1 is only a computed highlight, the
   * purchaser may select a different quoted vendor for reasons the
   * frontend doesn't model (stock, lead time, etc.). `null` until chosen.
   * Modeled per-line rather than one selection for the whole RFQ, since
   * different lines can have different lowest bidders — a **FRONTEND
   * IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #30.
   */
  selectedVendorId: string | null;
}

/**
 * One vendor's quoted rate for one `RFQLine` — "Vendor 1/2/3: rate +
 * amount" per the owner's comparison table. Up to 3 per line (enforced by
 * `RFQAdapter.setVendorQuote`); amount is always computed at render time
 * (`rate × RFQLine.quantity`), never stored, per the field typing
 * conventions in `docs/DATA_MODELS.md`.
 */
export interface RFQVendorQuote {
  id: string;
  rfqLineId: string;
  vendorId: string;
  rate: number;
  quotedAt: string;
}

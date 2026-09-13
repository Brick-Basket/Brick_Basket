import type { StockMaterial } from "@/types/domain/stock-entry";

/**
 * Store Material Requisition ("MR") — Store Management §6B: *"MR — Site
 * Project Manager. MR flows to stores for material issuance."* Added in
 * the post-Part-20 stabilization pass (Phase 2); §6B had no dedicated
 * route anywhere in the original 20-part roadmap and was tracked as an
 * explicit gap in `docs/OPEN_QUESTIONS.md` #32 until now.
 *
 * **Deliberately a separate module from Purchase Requisition / Material
 * Requisition (§5B, Part 8 — `src/types/domain/requisition.ts`,
 * `PurchaseRequisition`/`MaterialRequirement`), despite the very similar
 * owner naming.** They serve different purposes and this build keeps them
 * fully distinct rather than folding one into the other:
 *  - `PurchaseRequisition` (Part 8) is a request to **buy** material from
 *    a vendor — it feeds RFQ → PO → GRN, and its lines reference `ACEItem`
 *    rates.
 *  - `StoreRequisition` (this file) is a request to **issue material
 *    already in stock** to a project site — its only downstream effect is
 *    Stock (Part 11), and it never touches RFQ/PO/ACE at all.
 * `material` reuses `StockMaterial` (Part 11) rather than a separate
 * vocabulary, since the whole point of this module is requesting stock
 * that's tracked under that same closed reference list — the one place in
 * this app where two modules' material vocabularies are *confirmed* to
 * line up (contrast `docs/OPEN_QUESTIONS.md` #32(d), where GRN's free-text
 * line descriptions do **not** confirmedly map onto `StockMaterial`).
 *
 * **Status vocabulary and workflow — frontend implementation decisions,
 * not owner-confirmed** (the owner's one-line §6B text names no states at
 * all): `draft` (the requester is still building it) → `submitted` (sent
 * to Stores) → `approved` (Stores has decided to issue, and how much —
 * `approvedIssuedQuantity`, which may be less than `requestedQuantity`) or
 * `rejected` → `issued` (Stores has actually handed over the material,
 * `issueDate` set). Revising a `rejected` request resets it to `draft`,
 * mirroring `PurchaseRequisition`/`Contract`'s decline-and-revise
 * precedent. No dedicated audit-log entity — the same scope reduction
 * already applied to RFQ/GRN/MRC (`docs/OPEN_QUESTIONS.md` #30/#32/#33),
 * since §6B's text is a single sentence with no "History" ask.
 *
 * **Stock impact is recorded on this entity, not auto-written into
 * `StockEntry`'s own ledger.** `StockEntry` (Part 11) is a manually
 * maintained, per-project/per-material/per-day aggregate row that Store
 * staff already enter by hand; auto-injecting an issuance into that ledger
 * risks silently double-counting or landing on the wrong day's row. Once
 * `issue()` runs, `approvedIssuedQuantity`/`issueDate` are the durable
 * record of what left stock and when — a real backend, or Store staff
 * themselves, should decide how (or whether) that reconciles against a
 * `StockEntry.consumedToday` figure for that day. Flagged, not silently
 * automated — see `docs/OPEN_QUESTIONS.md`.
 *
 * Backend ownership: persistence, numbering, and any real inventory
 * decrement are backend-owned once a real stock ledger exists.
 */
export type StoreRequisitionStatus = "draft" | "submitted" | "approved" | "rejected" | "issued";

export interface StoreRequisition {
  id: string;
  projectId: string;
  /** Backend-assigned display reference, e.g. "MR-0004". */
  requisitionNumber: string;
  requestedBy: string;
  requestedByName: string;
  /** ISO date (day precision) — when the request was raised. */
  requestDate: string;
  material: StockMaterial;
  /** Free-text name, only meaningful when `material === "other"`. */
  otherMaterialName?: string;
  uom: string;
  requestedQuantity: number;
  /** Set once Stores approves or issues — may be less than `requestedQuantity`. Unset while `draft`/`submitted`/`rejected`. */
  approvedIssuedQuantity?: number;
  status: StoreRequisitionStatus;
  /** The requester's own note, e.g. why the material is needed. */
  remarks?: string;
  /** Stores' own note on their approve/reject/issue decision — distinct from the requester's `remarks` above. */
  storeRemarks?: string;
  /** ISO date — set only once `status === "issued"`. */
  issueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateStoreRequisitionInput = {
  projectId: string;
  requestDate: string;
  material: StockMaterial;
  otherMaterialName?: string;
  uom: string;
  requestedQuantity: number;
  remarks?: string;
};

/** `projectId` is immutable after creation, matching every other module's project-scoped entity. */
export type UpdateStoreRequisitionInput = Partial<Omit<CreateStoreRequisitionInput, "projectId">>;

export type StoreRequisitionDecisionInput = {
  approvedIssuedQuantity?: number;
  storeRemarks?: string;
};

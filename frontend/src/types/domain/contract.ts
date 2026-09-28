/**
 * Contract / ContractLineItem — the Contract Management module (admin +
 * customer), per the owner requirements: predefined line-item category
 * dropdown, editable quantities, admin "send for acceptance", customer
 * "review/accept", acceptance/audit history, and a read-only state once
 * finally accepted.
 *
 * Source module: Contract Management (Part 5). A `Contract` is created
 * from an admin action against a `Customer` (usually one converted from a
 * `Lead` — see `docs/WORKFLOWS.md`'s lead pipeline), and optionally scoped
 * to a `Project`.
 * Dependent modules: Documents (Part 6) may attach drawings to an accepted
 * contract's project; Finance (Part 15+) references contract value in cost
 * accounting — neither implemented yet.
 * Backend ownership: persistence, numbering, and enforcing which status
 * transitions are valid are backend-owned. The frontend only creates/
 * reads/updates contracts through the adapter boundary
 * (`contracts-adapter.ts`) — nothing here is authoritative.
 */

// CONFIGURABLE — pending confirmation (see docs/OPEN_QUESTIONS.md #3). The
// owner requirements confirm a contract line item needs "a predefined
// category dropdown" but never name the categories. Reused ahead of
// schedule from the Finance/Cost Accounting category set the master
// prompt confirms for Part 15 ("civil, mechanical, electrical, plumbing &
// sanitary, finishing, labour, other") purely for internal consistency —
// swap this union (and `contract-category-config.ts`) the moment the
// client supplies the real list.
export type ContractCategory =
  | "civil"
  | "electrical"
  | "plumbing_sanitary"
  | "mechanical"
  | "finishing"
  | "labour"
  | "design_consultancy"
  | "other";

// CONFIGURABLE — pending confirmation (see docs/OPEN_QUESTIONS.md #3 and
// docs/STATUS_DEFINITIONS.md). The owner requirements confirm "send for
// acceptance" (admin) and "review/accept" (customer) plus a read-only
// state after final acceptance. `"declined"` and the admin `withdraw`
// action that returns a contract to `"draft"` are FRONTEND IMPLEMENTATION
// DECISIONS, not owner-confirmed — a real acceptance workflow needs some
// way to hand a contract back for revision, but the owner text only names
// "accept". Revisit both the moment the backend defines the authoritative
// state machine.
export type ContractStatus = "draft" | "sent_for_acceptance" | "accepted" | "declined";

/**
 * Contract-level category — owner correction: "In category, IHB/Large
 * construction or special services should reflect." Distinct from
 * `ContractCategory` above, which is the per-line-item category
 * (civil/electrical/etc.) — this is a single classification for the whole
 * contract, driving two conditional fields on `Contract` itself:
 *   - `large_construction` → `servicesDescription` must capture every
 *     service included (owner: "it should capture all services in
 *     description of services").
 *   - `ihb` ("Individual House Building") → `packageCriteria` must be set,
 *     reusing the four owner-confirmed package tiers
 *     (Essential/Smart/Premium/Signature — see
 *     `src/lib/content/public-site.ts`'s `CONSTRUCTION_PACKAGES`) rather
 *     than inventing a separate tier list.
 * FRONTEND IMPLEMENTATION DECISION — see docs/OPEN_QUESTIONS.md.
 */
export type ContractCategoryType = "ihb" | "large_construction" | "special_services";

/** Contract-format file attached at creation — owner correction #3 ("Contract format shall be shared for adding it as an attachment"). Same mock-only, session-lived object-URL pattern as Document Management (see docs/FILE_UPLOADS.md) — no real file storage yet. */
export interface ContractAttachment {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
}

export interface ContractLineItem {
  id: string;
  category: ContractCategory;
  description: string;
  uom: string;
  quantity: number;
  /** Rupees per `uom` unit. Frontend-decision to keep rate+quantity separate rather than a single lump amount, so quantities stay genuinely editable per the owner requirement. */
  rate: number;
}

export interface Contract {
  id: string;
  /**
   * Human-readable reference shown to the customer. FRONTEND IMPLEMENTATION
   * DECISION (owner correction #1): format changed from the previous demo
   * scheme to `BB/{State}/{City}/{Year}/{00001}` (e.g.
   * "BB/Gujarat/Vadodara/2026/00001"), with the 5-digit sequence scoped per
   * state+city+financial year (so numbering restarts at 00001 for a new
   * city or a new year) rather than one global running number — the more
   * common convention for this kind of branch/location reference number.
   * State/city segments have spaces stripped for a clean, unambiguous
   * reference. Backend-assigned in a real system; generated client-side in
   * this mock — see `contracts-adapter.ts` and docs/OPEN_QUESTIONS.md.
   */
  contractNumber: string;
  title: string;
  customerId: string;
  /** The lead this contract originated from, if any — see docs/WORKFLOWS.md's lead pipeline. */
  leadId?: string;
  projectId?: string;
  /** City the contract/project is for — owner correction #5 ("in place of customer name, city should reflect") and #6 (city autocomplete on create). */
  city: string;
  /** State the city is in — captured alongside `city` (via `CityAutocomplete`), feeds the contract number format above. */
  state: string;
  /** Contract-level category — see `ContractCategoryType`. */
  contractCategory: ContractCategoryType;
  /** Required, free-text, only when `contractCategory === "large_construction"`. */
  servicesDescription?: string;
  /** `ConstructionPackage["slug"]` (Essential/Smart/Premium/Signature), required only when `contractCategory === "ihb"`. */
  packageCriteria?: string;
  /** Contract-format file attached at creation, if any — owner correction #3. */
  attachment?: ContractAttachment;
  /**
   * Date the contract was actually drawn up/agreed, as opposed to
   * `createdAt` (when the record was entered into the system). FRONTEND
   * IMPLEMENTATION DECISION per owner correction #7 ("date of creation of
   * contract option should be there") — mirrors `Lead.receivedDate`'s
   * rationale. Plain `YYYY-MM-DD` string, editable on the create form,
   * defaults to today.
   */
  contractDate: string;
  status: ContractStatus;
  lineItems: ContractLineItem[];
  /** Free-text terms/notes shown alongside the line items. */
  notes?: string;
  sentAt?: string | null;
  respondedAt?: string | null;
  /** Customer-supplied reason, only set when `status === "declined"`. */
  declineReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a contract — always starts life as `status: "draft"`. */
export type CreateContractInput = {
  title: string;
  customerId: string;
  leadId?: string;
  projectId?: string;
  city: string;
  state: string;
  contractCategory: ContractCategoryType;
  servicesDescription?: string;
  packageCriteria?: string;
  contractDate: string;
  notes?: string;
  lineItems: Omit<ContractLineItem, "id">[];
};

/** Fields the admin edit form may update — only while `status` is `"draft"` or `"declined"` (see docs/WORKFLOWS.md). */
export type UpdateContractInput = {
  title?: string;
  city?: string;
  state?: string;
  contractCategory?: ContractCategoryType;
  servicesDescription?: string;
  packageCriteria?: string;
  contractDate?: string;
  attachment?: ContractAttachment;
  notes?: string;
  lineItems?: Omit<ContractLineItem, "id">[];
};

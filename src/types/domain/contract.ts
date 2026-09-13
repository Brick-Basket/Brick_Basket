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
  /** Human-readable reference shown to the customer, e.g. "BB-CNT-2026-014". Backend-assigned. */
  contractNumber: string;
  title: string;
  customerId: string;
  /** The lead this contract originated from, if any — see docs/WORKFLOWS.md's lead pipeline. */
  leadId?: string;
  projectId?: string;
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
  notes?: string;
  lineItems: Omit<ContractLineItem, "id">[];
};

/** Fields the admin edit form may update — only while `status` is `"draft"` or `"declined"` (see docs/WORKFLOWS.md). */
export type UpdateContractInput = {
  title?: string;
  notes?: string;
  lineItems?: Omit<ContractLineItem, "id">[];
};

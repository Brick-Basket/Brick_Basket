/**
 * MRC (Material Receipt Certificate) — Part 12. Certifies, per the owner
 * requirements, "materials used, make, warranty terms" for a customer's
 * project, with a customer-facing acceptance step and a link back to the
 * Customer module.
 *
 * CONFIGURABLE — see docs/OPEN_QUESTIONS.md #6 and #33. The owner
 * requirements ask for MRC list/detail wired to "the customer-acceptance
 * state" without saying where acceptance happens; this frontend resolves
 * it as customer-portal-only, mirroring Contract Management's
 * admin-issues/customer-responds split (see contract.ts) — not an
 * owner-confirmed answer.
 *
 * Source module: Store Management (Part 11) — `MRCLineItem.source: "grn"`
 * certifies materials that were formally received against a Purchase
 * Order (see grn.ts). `source: "manual"` covers materials logged straight
 * onto an MRC with no GRN behind them — reusing the same
 * predefined-vs-freeform discriminator `MaterialRequirement.source`
 * already established in requisition.ts (Part 8), since not every
 * customer-linked demo project has GRN data yet (only
 * `proj_modern_residence`, which has no `customerId`, does).
 *
 * `customerId` is chosen directly by whoever issues the MRC — decoupled
 * from `projectId`, exactly like `Contract.customerId`/`Contract.projectId`
 * — rather than auto-derived from `Project.customerId`. A real backend
 * should decide whether these must match once Project↔Customer ownership
 * (see docs/OPEN_QUESTIONS.md #19) is real.
 *
 * Backend ownership: persistence, numbering, and enforcing which status
 * transitions are valid are backend-owned. The frontend only creates/
 * reads/updates MRCs through the adapter boundary (`mrc-adapter.ts`) —
 * nothing here is authoritative.
 */
export type MRCStatus = "draft" | "issued" | "accepted" | "declined";

export interface MRC {
  id: string;
  /** Human-readable reference shown to the customer, e.g. "BB-MRC-2026-001". Backend-assigned. */
  mrcNumber: string;
  customerId: string;
  projectId?: string;
  status: MRCStatus;
  /** Free-text notes shown alongside the line items. */
  notes?: string;
  issuedAt?: string | null;
  respondedAt?: string | null;
  /** Customer-supplied reason, only set when `status === "declined"`. */
  declineReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MRCLineItem {
  id: string;
  mrcId: string;
  source: "grn" | "manual";
  /** Set only when `source === "grn"` — the GRNLineItem this line certifies. */
  grnLineItemId?: string;
  description: string;
  uom: string;
  quantity: number;
  /** Manufacturer/brand — "make" in the owner requirements. */
  make: string;
  /**
   * Free text, e.g. "12 months from installation" or a certificate
   * number/date — no confirmed structured warranty model exists yet
   * (mirrors Document's similarly free-text warranty fields, Part 6).
   */
  warrantyTerms?: string;
}

/** One line as submitted from the form — the two source shapes share `quantity`/`warrantyTerms` but diverge on what else must be supplied. */
export type CreateMRCLineInput =
  | { source: "grn"; grnLineItemId: string; quantity: number; warrantyTerms?: string }
  | { source: "manual"; description: string; uom: string; quantity: number; make: string; warrantyTerms?: string };

/** Payload for creating an MRC — always starts life as `status: "draft"`. */
export interface CreateMRCInput {
  customerId: string;
  projectId?: string;
  notes?: string;
  lines: CreateMRCLineInput[];
}

/** Fields the admin edit form may update — only while `status` is `"draft"` or `"declined"` (mirrors Contract, see docs/WORKFLOWS.md). */
export interface UpdateMRCInput {
  notes?: string;
  lines?: CreateMRCLineInput[];
}

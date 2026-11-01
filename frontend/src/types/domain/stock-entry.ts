/**
 * Stock Statement — Store Management, Part 11.
 *
 * Owner requirements (§6C): "Track: Material, Unit, Opening stock,
 * Received today, Consumed today, Closing stock, Supplier, Remarks."
 * Reference material list confirmed verbatim: Cement, Sand, Aggregate,
 * TMT Steel, Bricks, Tiles, Pipes, Electrical cable, Paint, Sanitary
 * fixtures, Other. "Values must be API-ready."
 */
export type StockMaterial =
  | "cement"
  | "sand"
  | "aggregate"
  | "tmt_steel"
  | "bricks"
  | "tiles"
  | "pipes"
  | "electrical_cable"
  | "paint"
  | "sanitary_fixtures"
  | "other";

/**
 * A per-project, per-material, per-day ledger row, entered by
 * `store_personnel`/`admin`. **FRONTEND IMPLEMENTATION DECISION**:
 * modeled as a manually-maintained daily entry rather than one auto-
 * updated by GRN receipts — `GRNLineItem` doesn't reference a
 * `StockMaterial` (its description/UOM come from free-text PO lines, not
 * this closed reference list), so there's no reliable automatic link
 * between "a GRN was received" and "which stock ledger row that
 * corresponds to" without further confirmation. See
 * docs/OPEN_QUESTIONS.md #32. `closingStock` is always computed
 * (`openingStock + receivedToday - consumedToday`) at render time, never
 * stored — same "computed, not stored" convention as every derived money
 * total elsewhere in this app.
 */
export interface StockEntry {
  id: string;
  projectId: string;
  material: StockMaterial;
  /** Free-text name, only meaningful when `material === "other"`. */
  otherMaterialName?: string;
  uom: string;
  /** ISO date (no time component) — the day this ledger row covers. */
  date: string;
  openingStock: number;
  receivedToday: number;
  consumedToday: number;
  /**
   * Free text rather than a `Vendor.id` reference — not every stock
   * movement traces back to a formal Vendor Management (Part 7) record
   * (e.g. an inter-project transfer or an adjustment). FRONTEND
   * IMPLEMENTATION DECISION, see docs/OPEN_QUESTIONS.md #32.
   */
  supplierName?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateStockEntryInput = Omit<StockEntry, "id" | "createdAt" | "updatedAt">;

export type UpdateStockEntryInput = Partial<Omit<CreateStockEntryInput, "projectId" | "material">>;

/**
 * **Spec-review correction (docs/OPEN_QUESTIONS.md #32)** — a read-only
 * cross-module reconciliation view for one (project, material, date) key.
 * GRN, Store Requisition ("MR"), and Wastage can each independently move
 * this same material on this same day, but this file's own header
 * comment already explains, for good reason, why `StockEntry.receivedToday`/
 * `consumedToday` stay a manually entered figure rather than something
 * auto-written by another module — the same principle
 * `StoreRequisitionsAdapter.issue`'s doc comment states explicitly ("The
 * frontend must never become the authority for stock truth"). `StockTrace`
 * resolves the "4 independent silos" gap a different way: it surfaces
 * what GRN/MR/Wastage recorded for the same key side by side with the
 * manual entry, so whoever is filling in today's Stock Statement row can
 * see it and choose to match it — a reconciliation aid, never an
 * auto-override. See `StockAdapter.getTrace`.
 */
export interface StockTrace {
  projectId: string;
  material: StockMaterial;
  date: string;
  /** Σ `GRNLineItem.receivedQuantity` tagged `stockMaterial === material`, across every GRN received on this date, for this project. */
  tracedReceivedToday: number;
  /** How many GRN line items contributed to `tracedReceivedToday` — for an "from N GRN receipt(s)" caption. */
  tracedReceivedLineCount: number;
  /** Σ `StoreRequisition.approvedIssuedQuantity` for requisitions with `status === "issued"` and this `issueDate`, this material/project. */
  tracedIssuedToday: number;
  /** Σ `WastageEntry.quantity` recorded on this date, this material/project. */
  tracedWastedToday: number;
}

/**
 * Cumulative (all-time, not date-scoped) GRN→MR visibility for one
 * (project, material) key. Added so `StoreRequisitionForm` can show what
 * has actually arrived via GRN for this project/material before someone
 * raises a request against it — closing the specific gap of a freshly
 * recorded GRN being invisible on the Material Requisitions screen, per
 * the owner's "flow of channel" step 11 ("site can create material
 * requisition from the updated stock after GRN"). Same reconciliation-aid
 * principle as `StockTrace` above — this is a read-only cross-module view,
 * never a write, and never the authority for real stock (see
 * `StoreRequisitionsAdapter.issue`'s own doc comment, which this respects
 * unchanged). Unlike `StockTrace`, which is scoped to one day to match the
 * Stock Statement's daily ledger, this sums across every date, since a
 * Material Requisition isn't tied to a single day the way a Stock
 * Statement row is.
 */
export interface MaterialReceiptSummary {
  projectId: string;
  material: StockMaterial;
  /** Σ `GRNLineItem.receivedQuantity` tagged `stockMaterial === material`, across every GRN ever recorded for this project. */
  totalReceived: number;
  /** How many GRN line items contributed — for a "from N GRN receipt(s)" caption. */
  receivedLineCount: number;
  /** Distinct `GRN.grnNumber`s that contributed, for a reference list (e.g. "via BB-GRN-2026-003"). */
  grnNumbers: string[];
  /** Σ `StoreRequisition.approvedIssuedQuantity` for every already-`issued` requisition against this material/project, any date — i.e. what other MRs have already taken. */
  totalIssuedViaOtherRequisitions: number;
  /** Σ `WastageEntry.quantity` recorded against this material/project, any date. */
  totalWasted: number;
}

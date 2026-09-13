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

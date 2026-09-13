/**
 * GSTR Financial Reporting — Finance, Part 17 (§8F).
 *
 * Owner requirements, in full: "Two categories: Purchase — purchases
 * inclusive of taxes after stores GRN, including service & supply. Sales
 * — all business sales including constructed house and materials, if
 * any." No field list, no data model — everything below is a **FRONTEND
 * IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #38.
 *
 * Modeled as one `type`-discriminated entity rather than two, mirroring
 * `Payment`'s `direction` discriminator (Part 16) — both categories share
 * almost every field (period, taxable value, tax amount, GSTIN), so a
 * single entity with a `type` switch avoids near-duplicating the shape.
 *
 * A `"purchase"` row is explicitly "after stores GRN" per the owner
 * text, so it must reference a real `GRN` (`grnId`, cross-adapter
 * validated, never a live join) — `vendorId`/`projectId` are denormalized
 * from that GRN at creation, the same convention every procurement-chain
 * entity uses. A `"sales"` row covers "constructed house" sales, which
 * this app already models as an accepted `Contract` (`contractId`,
 * optional, cross-adapter validated when given, `status: "accepted"`
 * only) — or a manual entry (`saleDescription`) for "materials, if any"
 * sales, since no separate Sales/Materials-sale module exists yet.
 */
export type GSTRRecordType = "purchase" | "sales";

export interface GSTRRecord {
  id: string;
  type: GSTRRecordType;
  /** The GST return period this entry belongs to, `"YYYY-MM"`. */
  period: string;
  /** → `Project.id`. Denormalized from the source `GRN`/`Contract` when one is linked; chosen directly for a manual sales entry. */
  projectId?: string;
  /** → `GRN.id` — required when `type === "purchase"`, immutable after creation. */
  grnId?: string;
  /** Denormalized from the `GRN`'s Purchase Order at creation, when `type === "purchase"`. */
  vendorId?: string;
  /** → `Contract.id` (must be `status: "accepted"`) — optional when `type === "sales"`; the "constructed house" case. Immutable after creation once set. */
  contractId?: string;
  /** Free text describing the sale when no `Contract` is behind it — the "materials, if any" case. */
  saleDescription?: string;
  /** Denormalized from the `Contract` at creation, or chosen directly for a manual sale. */
  customerId?: string;
  gstin?: string;
  /** Rupees — the value the tax is calculated on. */
  taxableValue: number;
  /** Rupees. */
  taxAmount: number;
  /** Free-text invoice/GRN/receipt reference shown on the row — not a foreign key. */
  invoiceReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateGSTRRecordInput = Omit<GSTRRecord, "id" | "createdAt" | "updatedAt" | "vendorId" | "customerId">;

export type UpdateGSTRRecordInput = Partial<
  Pick<CreateGSTRRecordInput, "period" | "taxableValue" | "taxAmount" | "gstin" | "invoiceReference" | "notes">
>;

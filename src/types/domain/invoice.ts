/**
 * Vendor Invoice — Finance: Payments & Receipts, Part 16 (§8B).
 *
 * Owner requirements: "Capture PO/vendor code/invoice details/invoice
 * amount/invoice copy/payment details." This build splits that single
 * bullet into two entities, matching the ACE → Requisition → RFQ → PO
 * chain's precedent of one entity per hand-off stage: `Invoice` (this
 * file) captures what a vendor billed against an issued `PurchaseOrder`;
 * `Payment` (`payment.ts`) captures what was actually paid against it —
 * "payment details" is its own record, not a field on this one, because
 * a single invoice is very often settled across more than one payment
 * (the same "split delivery" reasoning GRN applied to POs in Part 11).
 *
 * `vendorId`/`projectId` are denormalized from the source `PurchaseOrder`
 * at creation (never a live join), the same snapshot convention every
 * earlier procurement-chain entity uses. Can only be created against a
 * `PurchaseOrder` whose `status === "issued"` — mirroring `GRN`'s rule
 * against the same field (Part 11).
 *
 * `invoiceCopy*` fields are metadata-only, no real file bytes — the same
 * treatment `Document` gives file metadata (Part 6), scaled down: this
 * module doesn't need Document's versioning/preview machinery, just a
 * record that a copy exists. **FRONTEND IMPLEMENTATION DECISION**, see
 * `docs/OPEN_QUESTIONS.md` #37.
 *
 * No stored status field — `paymentStatus` ("unpaid"/"partially_paid"/
 * "paid") is always computed at render time from the sum of `Payment`
 * rows referencing this invoice (`src/components/payments/payment-math.ts`),
 * never persisted — the same "computed, not stored" convention as
 * `CostEntry`'s variance (Part 15).
 */
export interface Invoice {
  id: string;
  /** → `PurchaseOrder.id` — must be `status: "issued"` at creation time. */
  purchaseOrderId: string;
  /** Denormalized from the `PurchaseOrder` at creation. */
  vendorId: string;
  /** Denormalized from the `PurchaseOrder` at creation. */
  projectId: string;
  invoiceNumber: string;
  invoiceDate: string;
  /** Rupees — "invoice amount." */
  invoiceAmount: number;
  invoiceCopyFileName?: string;
  invoiceCopyFileSizeBytes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateInvoiceInput = {
  purchaseOrderId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  invoiceCopyFileName?: string;
  invoiceCopyFileSizeBytes?: number;
  notes?: string;
};

export type UpdateInvoiceInput = Partial<Omit<CreateInvoiceInput, "purchaseOrderId">>;

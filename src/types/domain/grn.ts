/**
 * Goods Receipt Note (GRN) — Store Management, Part 11.
 *
 * Owner requirements (§6A, "Admin/Stores only"): "Project scope, Purchase
 * request, Materials ordered, Materials received, Brand, Warranty
 * certificate, Rate, Quantity." **FRONTEND IMPLEMENTATION DECISION** — the
 * owner's "Purchase request" field is modeled as a reference to the
 * source `PurchaseOrder` (Part 10), not a separate `PurchaseRequisition`
 * reference, since the app's relationship spine already runs
 * `PurchaseOrder → GRN → StockEntry → CostEntry` and a GRN's job is to
 * record what actually arrived against what was ordered on an issued PO.
 * See docs/OPEN_QUESTIONS.md #32.
 *
 * A GRN can only be created against a PurchaseOrder whose
 * `status === "issued"` (enforced by `GRNAdapter.create`) — goods are
 * received only after a PO has actually been sent to the vendor. More
 * than one GRN may be recorded against the same PO (a real delivery is
 * often split across more than one truck/date) — this build does not
 * enforce that the sum of `receivedQuantity` across a line's GRNs never
 * exceeds `orderedQuantity`; that validation is left to the backend once
 * the client's real over-receipt policy is confirmed.
 */
export interface GRN {
  id: string;
  grnNumber: string;
  /** → PurchaseOrder.id — the "Purchase request" this GRN receives against. */
  purchaseOrderId: string;
  /** Denormalized from the PurchaseOrder at creation time — never a live join. */
  projectId: string;
  /** Denormalized from the PurchaseOrder at creation time. */
  vendorId: string;
  receivedBy: string;
  receivedByName: string;
  /** The date goods were actually received — may differ from `createdAt` (when the record was entered). */
  receivedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * One row per claimed `PurchaseOrderLineItem`. `orderedQuantity`/`uom`/
 * `description`/`rate` are a **snapshot** taken from the source PO line
 * item at GRN-creation time (same pattern as `PurchaseOrderLineItem`
 * itself snapshotting its `RFQLine`) — `receivedQuantity`/`brand`/
 * `warrantyCertificateNumber` are what the store recorded on receipt.
 */
export interface GRNLineItem {
  id: string;
  grnId: string;
  purchaseOrderLineItemId: string;
  description: string;
  uom: string;
  orderedQuantity: number;
  receivedQuantity: number;
  /** Snapshot of the PO line item's rate — shown for reference, not re-entered. */
  rate: number;
  /** The brand actually delivered — owner-required "Brand" field. */
  brand?: string;
  /**
   * Free-text certificate reference/number — owner-required "Warranty
   * certificate" field. This build captures only a reference string, not
   * an attached file; a real warranty certificate document should link
   * through the Documents module (Part 6) once that wiring is confirmed.
   */
  warrantyCertificateNumber?: string;
}

export interface CreateGRNLineInput {
  purchaseOrderLineItemId: string;
  receivedQuantity: number;
  brand?: string;
  warrantyCertificateNumber?: string;
}

export interface CreateGRNInput {
  purchaseOrderId: string;
  receivedAt: string;
  notes?: string;
  lines: CreateGRNLineInput[];
}

export interface UpdateGRNInput {
  receivedAt?: string;
  notes?: string;
  lines?: CreateGRNLineInput[];
}

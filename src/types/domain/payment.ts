/**
 * Payment / Receipt — Finance: Payments & Receipts, Part 16 (§8B).
 *
 * The owner's "payment details" bullet, modeled as its own entity rather
 * than a field on `Invoice` (see that file's header comment) so one
 * invoice can be settled across several payments, and so the same shape
 * can also cover money coming *in* from a customer — the module is named
 * "Payments **& Receipts**," and the owner separately requires a
 * read-only `/dashboard/payments` view for customers, which has nothing
 * to show unless customer-side receipts are modeled somewhere.
 * **FRONTEND IMPLEMENTATION DECISION** — the owner text names only the
 * vendor/PO side explicitly; the receipt side and this single-entity,
 * `direction`-discriminated shape are inventions. See
 * `docs/OPEN_QUESTIONS.md` #37.
 *
 * A `"payment"` (money out) references an `Invoice`; a `"receipt"`
 * (money in) references an accepted `Contract`. `vendorId`/`customerId`
 * are denormalized from that reference at creation, the same snapshot
 * convention used throughout the procurement chain. `projectId` is a
 * plain, independently-selected field rather than derived from the
 * reference — `Contract.projectId` is optional (Part 5), so it can't
 * always be inferred.
 *
 * `mode` is a **FRONTEND IMPLEMENTATION DECISION** — the owner text names
 * "payment details" without a vocabulary; see `docs/OPEN_QUESTIONS.md`
 * #37.
 */
export type PaymentDirection = "payment" | "receipt";

export type PaymentMode = "bank_transfer" | "cheque" | "cash" | "upi" | "other";

export interface Payment {
  id: string;
  direction: PaymentDirection;
  /** Independently selected — see header comment on why this isn't derived from `invoiceId`/`contractId`. */
  projectId: string;
  /** → `Invoice.id`. Set only when `direction === "payment"`. */
  invoiceId?: string;
  /** Denormalized from the `Invoice`'s `PurchaseOrder` at creation. Set only when `direction === "payment"`. */
  vendorId?: string;
  /** → `Contract.id` (must be `status: "accepted"`). Set only when `direction === "receipt"`. */
  contractId?: string;
  /** Denormalized from the `Contract` at creation. Set only when `direction === "receipt"`. */
  customerId?: string;
  /** Rupees. */
  amount: number;
  paymentDate: string;
  mode: PaymentMode;
  /** Free text — cheque number, UTR, transaction id, etc. */
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreatePaymentInput = {
  direction: PaymentDirection;
  projectId: string;
  invoiceId?: string;
  contractId?: string;
  amount: number;
  paymentDate: string;
  mode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
};

export type UpdatePaymentInput = Partial<Pick<CreatePaymentInput, "amount" | "paymentDate" | "mode" | "referenceNumber" | "notes">>;

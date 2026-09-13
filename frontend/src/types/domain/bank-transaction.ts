/**
 * Bank & Cash Management — Finance, Part 16 (§8C).
 *
 * The owner requirements list this module as "prepare fields for:" a flat
 * set of names, without a workflow or a relational model around them —
 * unlike every other Finance sub-module, there's no confirmed link back
 * to `Payment`/`Invoice`. This build transcribes the owner's field list
 * directly (see the per-field notes below for the exact owner wording
 * each one maps to) as a flat, per-entry ledger record — the same
 * "flat record" pattern as `ACEItem`/`StockEntry`/`CostEntry`, no status.
 *
 * `paymentId` is an optional, **FRONTEND IMPLEMENTATION DECISION**
 * cross-link back to a `Payment` record, added so a bank/cash entry that
 * *does* correspond to a modeled Payment can reference it instead of
 * duplicating its amount/date by hand — but it's optional precisely
 * because the owner's field list (state/city/tax/TDS/GSTIN/ITC) clearly
 * anticipates entries with no such Payment behind them at all (e.g. a
 * small cash purchase). See `docs/OPEN_QUESTIONS.md` #37.
 */
export interface BankTransaction {
  id: string;
  /** Optional cross-link → `Payment.id` — see header comment. */
  paymentId?: string;
  /** "Party/vendor code" — free text, not a `Vendor.id` reference (the owner's field list names a code, not a relational lookup). */
  partyOrVendorCode: string;
  /** "Payment amount." Rupees. */
  paymentAmount: number;
  /** "Invoice number" — free text, not an `Invoice.id` reference; this ledger may cover entries with no modeled `Invoice` behind them. */
  invoiceNumber: string;
  /** "Account number." Optional — a cash entry has none. */
  accountNumber?: string;
  /** "UTR number." Optional — a cheque/cash entry has none. */
  utrNumber?: string;
  /** "Project name" → `Project.id`. */
  projectId: string;
  /** "Year of execution." */
  yearOfExecution: number;
  /** "State." */
  state: string;
  /** "City." */
  city: string;
  /** "Tax amount." Rupees. */
  taxAmount: number;
  /** "TDS details" — free text (e.g. "TDS @2% under Section 194C"); no structured TDS model is owner-confirmed. */
  tdsDetails?: string;
  /** "GSTIN." */
  gstin?: string;
  /** "Tax component" — free text (e.g. "CGST 9% + SGST 9%"); no structured tax-component model is owner-confirmed. */
  taxComponent?: string;
  /** "ITC applicability" — modeled as a boolean; the owner text names the field without a value vocabulary. **FRONTEND IMPLEMENTATION DECISION**. */
  itcApplicable: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateBankTransactionInput = Omit<BankTransaction, "id" | "createdAt" | "updatedAt">;

export type UpdateBankTransactionInput = Partial<CreateBankTransactionInput>;

/**
 * Taxes & Statutory Accounting — Finance, Part 17 (§8D).
 *
 * Owner requirements, in full: "Government taxes and statutory license
 * fees." That's it — no fields, no vocabulary, no workflow. This build
 * models a flat, per-obligation ledger record — a **FRONTEND
 * IMPLEMENTATION DECISION** end to end, since nothing beyond the module's
 * existence and its two-word scope ("taxes", "statutory license fees")
 * is owner-confirmed. See `docs/OPEN_QUESTIONS.md` #38.
 *
 * `type` distinguishes the two categories the owner's own text names
 * ("Government taxes" vs. "statutory license fees") — everything else
 * (the specific tax/fee, the authority it's owed to, amount, due/paid
 * dates) is free-form, since no fixed vocabulary exists for either
 * category (unlike, say, `DPRManpowerCategory`'s owner-confirmed list).
 *
 * `projectId` is optional — some obligations are project-scoped (GST on a
 * specific project's purchases) and some are org-wide (an annual trade
 * license renewal), and nothing in the owner text says every row must
 * belong to a project.
 *
 * No stored status field — `TaxRecordStatus` ("pending"/"paid"/"overdue")
 * is always computed at render time from `dueDate`/`paidDate`
 * (`src/components/finance/tax-record-math.ts`), the same "computed, not
 * stored" convention `ScheduleActivity`'s overdue state (Part 13) and
 * `Invoice.paymentStatus` (Part 16) already established. Every field
 * stays editable after creation — like `BankTransaction` (Part 16), there
 * is no owner-confirmed identity pairing here to lock.
 */
export type TaxRecordType = "tax" | "statutory_license_fee";

export interface TaxRecord {
  id: string;
  type: TaxRecordType;
  /** E.g. "GST — July 2026", "Labour License Renewal", "Professional Tax". Free text — no fixed vocabulary is owner-confirmed. */
  name: string;
  /** The government body/department this is owed to, e.g. "GST Department", "Municipal Corporation". */
  authority: string;
  /** → `Project.id`, when this obligation is tied to one project rather than the organization as a whole. */
  projectId?: string;
  /** Rupees. */
  amount: number;
  dueDate: string;
  /** `null`/unset while unpaid — set once payment is recorded. */
  paidDate?: string | null;
  /** Receipt/challan number, typically added once `paidDate` is set. */
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaxRecordInput = Omit<TaxRecord, "id" | "createdAt" | "updatedAt">;

export type UpdateTaxRecordInput = Partial<CreateTaxRecordInput>;

import type { BankTransaction } from "@/types/domain/bank-transaction";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/bank-adapter.ts.
 *
 * `bank_1`/`bank_2` cross-link to `pay_1`/`pay_2` (`src/data/mock/payments.ts`)
 * to show the optional `paymentId` link populated with real tax/TDS/GSTIN
 * detail. `bank_3` is deliberately standalone (no `paymentId`, no GSTIN,
 * `itcApplicable: false`) — a small cash purchase with no invoice/GST
 * behind it, to exercise the fields the owner's list clearly anticipates
 * for entries with no modeled `Payment` at all.
 */
export const mockBankTransactions: BankTransaction[] = [
  {
    id: "bank_1",
    paymentId: "pay_1",
    partyOrVendorCode: "300002",
    paymentAmount: 300_000,
    invoiceNumber: "VINV-2026-041",
    accountNumber: "0123456789012",
    utrNumber: "UTR2026072812345",
    projectId: "proj_modern_residence",
    yearOfExecution: 2026,
    state: "Maharashtra",
    city: "Mumbai",
    taxAmount: 54_000,
    tdsDetails: "TDS @2% under Section 194C — ₹6,000 deducted",
    gstin: "27AAAAA0000A1Z5",
    taxComponent: "CGST 9% + SGST 9%",
    itcApplicable: true,
    createdAt: "2026-07-28T09:05:00.000Z",
    updatedAt: "2026-07-28T09:05:00.000Z",
  },
  {
    id: "bank_2",
    paymentId: "pay_2",
    partyOrVendorCode: "300002",
    paymentAmount: 210_000,
    invoiceNumber: "VINV-2026-058",
    accountNumber: "0123456789012",
    projectId: "proj_modern_residence",
    yearOfExecution: 2026,
    state: "Maharashtra",
    city: "Mumbai",
    taxAmount: 37_800,
    tdsDetails: "TDS @2% under Section 194C — ₹4,200 deducted",
    gstin: "27AAAAA0000A1Z5",
    taxComponent: "CGST 9% + SGST 9%",
    itcApplicable: true,
    notes: "Paid by cheque — no UTR.",
    createdAt: "2026-08-10T09:05:00.000Z",
    updatedAt: "2026-08-10T09:05:00.000Z",
  },
  {
    id: "bank_3",
    partyOrVendorCode: "Local Hardware Store (Cash)",
    paymentAmount: 8_500,
    invoiceNumber: "CASH-2026-014",
    projectId: "proj_luxury_villa",
    yearOfExecution: 2026,
    state: "Maharashtra",
    city: "Pune",
    taxAmount: 0,
    itcApplicable: false,
    notes: "Petty cash purchase — small hardware items, no GST invoice.",
    createdAt: "2026-08-14T07:00:00.000Z",
    updatedAt: "2026-08-14T07:00:00.000Z",
  },
];

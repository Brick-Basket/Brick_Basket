import type { Payment } from "@/types/domain/payment";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/payments-adapter.ts.
 *
 * Vendor-side (`direction: "payment"`) entries reference `inv_1`/`inv_2`
 * (`src/data/mock/invoices.ts`) — `inv_1` gets a partial payment,
 * `inv_2` gets paid in full, `inv_3` gets none, exercising all three
 * `InvoicePaymentStatus` states. Customer-side (`direction: "receipt"`)
 * entries reference `contract_2` — the only `accepted` contract belonging
 * to the demo customer persona `u_customer` — so `/dashboard/payments`
 * has real, scoped data to show.
 */
export const mockPayments: Payment[] = [
  {
    id: "pay_1",
    direction: "payment",
    projectId: "proj_modern_residence",
    invoiceId: "inv_1",
    vendorId: "vendor_5",
    amount: 300_000,
    paymentDate: "2026-07-28",
    mode: "bank_transfer",
    referenceNumber: "UTR2026072812345",
    notes: "First installment against VINV-2026-041.",
    createdAt: "2026-07-28T09:00:00.000Z",
    updatedAt: "2026-07-28T09:00:00.000Z",
  },
  {
    id: "pay_2",
    direction: "payment",
    projectId: "proj_modern_residence",
    invoiceId: "inv_2",
    vendorId: "vendor_5",
    amount: 210_000,
    paymentDate: "2026-08-10",
    mode: "cheque",
    referenceNumber: "CHQ-004521",
    notes: "Paid in full against VINV-2026-058.",
    createdAt: "2026-08-10T09:00:00.000Z",
    updatedAt: "2026-08-10T09:00:00.000Z",
  },
  {
    id: "pay_3",
    direction: "receipt",
    projectId: "proj_luxury_villa",
    contractId: "contract_2",
    customerId: "u_customer",
    amount: 400_000,
    paymentDate: "2026-07-20",
    mode: "bank_transfer",
    referenceNumber: "UTR2026072099887",
    notes: "Advance against Interior Fit-Out Addendum.",
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "pay_4",
    direction: "receipt",
    projectId: "proj_luxury_villa",
    contractId: "contract_2",
    customerId: "u_customer",
    amount: 300_000,
    paymentDate: "2026-08-18",
    mode: "upi",
    referenceNumber: "UPI2026081876543",
    notes: "Second installment against Interior Fit-Out Addendum.",
    createdAt: "2026-08-18T11:00:00.000Z",
    updatedAt: "2026-08-18T11:00:00.000Z",
  },
];

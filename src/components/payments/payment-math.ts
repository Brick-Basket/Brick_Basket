import type { Payment } from "@/types/domain/payment";

/**
 * Pure, render-time-only computations backing `Invoice.paymentStatus` and
 * the Contract-receipts summary on `/dashboard/payments` — none of it is
 * ever stored on `Invoice`/`Payment`/`Contract` themselves, matching the
 * "computed, not stored" convention `CostEntry`'s variance established
 * (Part 15).
 */

export type InvoicePaymentStatus = "unpaid" | "partially_paid" | "paid";

/** Sum of every `"payment"`-direction `Payment` referencing this invoice. */
export function getTotalPaidForInvoice(payments: Payment[], invoiceId: string): number {
  return payments
    .filter((p) => p.direction === "payment" && p.invoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
}

export function getInvoicePaymentStatus(invoiceAmount: number, totalPaid: number): InvoicePaymentStatus {
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid >= invoiceAmount) return "paid";
  return "partially_paid";
}

/** Sum of every `"receipt"`-direction `Payment` referencing this contract. */
export function getTotalReceivedForContract(payments: Payment[], contractId: string): number {
  return payments
    .filter((p) => p.direction === "receipt" && p.contractId === contractId)
    .reduce((sum, p) => sum + p.amount, 0);
}

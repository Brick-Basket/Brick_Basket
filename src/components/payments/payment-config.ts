import type { PaymentDirection, PaymentMode } from "@/types/domain/payment";

/**
 * Label/order maps for `Payment.mode`/`Payment.direction` — both
 * **FRONTEND IMPLEMENTATION DECISIONS**, see `payment.ts`'s header
 * comment and `docs/OPEN_QUESTIONS.md` #37. Source of truth for display
 * strings across `PaymentForm`/`PaymentTable`/`PaymentFilters`.
 */
export const PAYMENT_MODE_CONFIG: Record<PaymentMode, { label: string }> = {
  bank_transfer: { label: "Bank Transfer" },
  cheque: { label: "Cheque" },
  cash: { label: "Cash" },
  upi: { label: "UPI" },
  other: { label: "Other" },
};

export const PAYMENT_MODE_ORDER: PaymentMode[] = ["bank_transfer", "cheque", "upi", "cash", "other"];

export const PAYMENT_DIRECTION_CONFIG: Record<PaymentDirection, { label: string }> = {
  payment: { label: "Payment (to Vendor)" },
  receipt: { label: "Receipt (from Customer)" },
};

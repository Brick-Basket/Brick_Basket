import { describe, expect, it } from "vitest";
import { getInvoicePaymentStatus, getTotalPaidForInvoice, getTotalReceivedForContract } from "./payment-math";
import type { Payment } from "@/types/domain/payment";

describe("payment-math", () => {
  describe("getTotalPaidForInvoice", () => {
    const payments = [
      { direction: "payment", invoiceId: "inv_1", amount: 300 },
      { direction: "payment", invoiceId: "inv_1", amount: 200 },
      { direction: "payment", invoiceId: "inv_2", amount: 999 }, // different invoice — excluded
      { direction: "receipt", invoiceId: "inv_1", amount: 500 }, // wrong direction — excluded
    ] as unknown as Payment[];

    it("sums only 'payment'-direction entries referencing the given invoice", () => {
      expect(getTotalPaidForInvoice(payments, "inv_1")).toBe(500);
    });

    it("returns 0 for an invoice with no matching payments", () => {
      expect(getTotalPaidForInvoice(payments, "inv_unknown")).toBe(0);
    });
  });

  describe("getInvoicePaymentStatus", () => {
    it("is 'unpaid' when nothing has been paid yet", () => {
      expect(getInvoicePaymentStatus(1000, 0)).toBe("unpaid");
    });

    it("is 'partially_paid' when some but not all has been paid", () => {
      expect(getInvoicePaymentStatus(1000, 400)).toBe("partially_paid");
    });

    it("is 'paid' once the total paid meets or exceeds the invoice amount", () => {
      expect(getInvoicePaymentStatus(1000, 1000)).toBe("paid");
      // Over-payment is still just "paid", not a distinct overpaid state.
      expect(getInvoicePaymentStatus(1000, 1200)).toBe("paid");
    });
  });

  describe("getTotalReceivedForContract", () => {
    const payments = [
      { direction: "receipt", contractId: "ct_1", amount: 100000 },
      { direction: "receipt", contractId: "ct_1", amount: 50000 },
      { direction: "receipt", contractId: "ct_2", amount: 999999 }, // different contract — excluded
      { direction: "payment", contractId: "ct_1", amount: 1 }, // wrong direction — excluded
    ] as unknown as Payment[];

    it("sums only 'receipt'-direction entries referencing the given contract", () => {
      expect(getTotalReceivedForContract(payments, "ct_1")).toBe(150000);
    });
  });
});

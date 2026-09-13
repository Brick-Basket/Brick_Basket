import type { Invoice } from "@/types/domain/invoice";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/invoices-adapter.ts.
 *
 * `po_1` (`proj_modern_residence`, `vendor_5`) is the only `"issued"`
 * Purchase Order in this build's mock data (Part 10), so every invoice
 * here is billed against it — representing two invoice batches against
 * one PO, the same "split delivery" idea GRN modeled against POs (Part
 * 11). `inv_1` is deliberately left partially paid and `inv_3` deliberately
 * has no payment against it at all, so `getInvoicePaymentStatus` exercises
 * all three states (see `src/data/mock/payments.ts`).
 */
export const mockInvoices: Invoice[] = [
  {
    id: "inv_1",
    purchaseOrderId: "po_1",
    vendorId: "vendor_5",
    projectId: "proj_modern_residence",
    invoiceNumber: "VINV-2026-041",
    invoiceDate: "2026-07-20",
    invoiceAmount: 450_000,
    notes: "Delivery batch 1 of 2 against BB-PO-2026-001.",
    createdAt: "2026-07-21T05:00:00.000Z",
    updatedAt: "2026-07-21T05:00:00.000Z",
  },
  {
    id: "inv_2",
    purchaseOrderId: "po_1",
    vendorId: "vendor_5",
    projectId: "proj_modern_residence",
    invoiceNumber: "VINV-2026-058",
    invoiceDate: "2026-08-05",
    invoiceAmount: 210_000,
    invoiceCopyFileName: "vinv-2026-058.pdf",
    invoiceCopyFileSizeBytes: 184_320,
    notes: "Delivery batch 2 of 2 against BB-PO-2026-001.",
    createdAt: "2026-08-06T05:00:00.000Z",
    updatedAt: "2026-08-06T05:00:00.000Z",
  },
  {
    id: "inv_3",
    purchaseOrderId: "po_1",
    vendorId: "vendor_5",
    projectId: "proj_modern_residence",
    invoiceNumber: "VINV-2026-066",
    invoiceDate: "2026-08-25",
    invoiceAmount: 95_000,
    notes: "Additional freight/handling charges — awaiting payment.",
    createdAt: "2026-08-26T05:00:00.000Z",
    updatedAt: "2026-08-26T05:00:00.000Z",
  },
];

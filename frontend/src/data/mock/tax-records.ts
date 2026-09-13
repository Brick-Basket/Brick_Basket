import type { TaxRecord } from "@/types/domain/tax-record";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/tax-records-adapter.ts. Deliberately dated around
 * this repo's working "today" (September 2026) so every computed status
 * (paid/pending/overdue) is represented at once, the same "cover every
 * state" convention Schedule's mock progress data used (Part 13).
 */
export const mockTaxRecords: TaxRecord[] = [
  {
    id: "tax_1",
    type: "tax",
    name: "GST — July 2026",
    authority: "GST Department",
    projectId: "proj_modern_residence",
    amount: 185_000,
    dueDate: "2026-08-20",
    paidDate: "2026-08-18",
    referenceNumber: "GST-CHLN-2026-0417",
    createdAt: "2026-08-01T05:00:00.000Z",
    updatedAt: "2026-08-18T09:00:00.000Z",
  },
  {
    id: "tax_2",
    type: "tax",
    name: "TDS Remittance — August 2026",
    authority: "Income Tax Department",
    amount: 42_000,
    dueDate: "2026-09-07",
    paidDate: null,
    notes: "Deducted from vendor payments during August — remittance is past due.",
    createdAt: "2026-08-25T05:00:00.000Z",
    updatedAt: "2026-08-25T05:00:00.000Z",
  },
  {
    id: "tax_3",
    type: "statutory_license_fee",
    name: "Labour License Renewal",
    authority: "Labour Department, Government of Gujarat",
    projectId: "proj_luxury_villa",
    amount: 15_000,
    dueDate: "2026-10-15",
    paidDate: null,
    createdAt: "2026-09-01T05:00:00.000Z",
    updatedAt: "2026-09-01T05:00:00.000Z",
  },
  {
    id: "tax_4",
    type: "statutory_license_fee",
    name: "Trade License Renewal",
    authority: "Municipal Corporation",
    amount: 8_500,
    dueDate: "2026-09-30",
    paidDate: null,
    createdAt: "2026-08-15T05:00:00.000Z",
    updatedAt: "2026-08-15T05:00:00.000Z",
  },
  {
    id: "tax_5",
    type: "tax",
    name: "Professional Tax — Q2 2026",
    authority: "State Professional Tax Office",
    amount: 25_000,
    dueDate: "2026-07-31",
    paidDate: "2026-07-29",
    referenceNumber: "PTX-2026-0219",
    createdAt: "2026-07-10T05:00:00.000Z",
    updatedAt: "2026-07-29T07:00:00.000Z",
  },
];

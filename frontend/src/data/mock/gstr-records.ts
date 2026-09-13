import type { GSTRRecord } from "@/types/domain/gstr-record";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/gstr-adapter.ts. `gstr_1`/`gstr_2` are the
 * "Purchase" category, each against a real Part-11 `GRN` (`grn_1`/
 * `grn_2`, both receiving against `po_1`/`vendor_5`); `gstr_3` is the
 * "Sales" category's "constructed house" case, against `contract_2`
 * (the same accepted contract Part 16's mock receipts settle);
 * `gstr_4` is the "materials, if any" case — a manual sales entry with
 * no `Contract` behind it.
 */
export const mockGSTRRecords: GSTRRecord[] = [
  {
    id: "gstr_1",
    type: "purchase",
    period: "2026-07",
    grnId: "grn_1",
    vendorId: "vendor_5",
    projectId: "proj_modern_residence",
    gstin: "27AAAAA0000A1Z5",
    taxableValue: 180_000,
    taxAmount: 32_400,
    invoiceReference: "VINV-2026-041",
    createdAt: "2026-07-20T06:00:00.000Z",
    updatedAt: "2026-07-20T06:00:00.000Z",
  },
  {
    id: "gstr_2",
    type: "purchase",
    period: "2026-07",
    grnId: "grn_2",
    vendorId: "vendor_5",
    projectId: "proj_modern_residence",
    gstin: "27AAAAA0000A1Z5",
    taxableValue: 24_200,
    taxAmount: 4_356,
    invoiceReference: "VINV-2026-058",
    createdAt: "2026-07-22T06:30:00.000Z",
    updatedAt: "2026-07-22T06:30:00.000Z",
  },
  {
    id: "gstr_3",
    type: "sales",
    period: "2026-08",
    contractId: "contract_2",
    customerId: "u_customer",
    projectId: "proj_luxury_villa",
    gstin: "24AACCB1234C1Z9",
    taxableValue: 1_000_000,
    taxAmount: 180_000,
    invoiceReference: "BB-SALES-2026-014",
    notes: "Constructed-house sale — modular kitchen & wardrobes + interior design consultancy.",
    createdAt: "2026-08-05T05:00:00.000Z",
    updatedAt: "2026-08-05T05:00:00.000Z",
  },
  {
    id: "gstr_4",
    type: "sales",
    period: "2026-08",
    saleDescription: "Sale of surplus TMT steel and cement bags",
    projectId: "proj_modern_residence",
    gstin: "24AACCB1234C1Z9",
    taxableValue: 45_000,
    taxAmount: 8_100,
    invoiceReference: "BB-SALES-2026-015",
    createdAt: "2026-08-12T05:00:00.000Z",
    updatedAt: "2026-08-12T05:00:00.000Z",
  },
];

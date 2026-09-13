import type { GRN, GRNLineItem } from "@/types/domain/grn";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/grn-adapter.ts. Both records receive against
 * `po_1` — the only `issued` Purchase Order seeded so far (Part 10) —
 * split across two deliveries to demonstrate that a PO's line items can
 * be received in more than one GRN: `grn_1` receives the paint line in
 * full and the sanitaryware line partially (2 of 4); `grn_2` completes
 * the sanitaryware line (the remaining 2).
 */
export const mockGRNs: GRN[] = [
  {
    id: "grn_1",
    grnNumber: "BB-GRN-2026-001",
    purchaseOrderId: "po_1",
    projectId: "proj_modern_residence",
    vendorId: "vendor_5",
    receivedBy: "u_store",
    receivedByName: "Meera Joshi",
    receivedAt: "2026-07-18T05:30:00.000Z",
    notes: "First delivery — paint arrived complete; sanitaryware short by 2 units, remainder promised within the week.",
    createdAt: "2026-07-18T06:00:00.000Z",
    updatedAt: "2026-07-18T06:00:00.000Z",
  },
  {
    id: "grn_2",
    grnNumber: "BB-GRN-2026-002",
    purchaseOrderId: "po_1",
    projectId: "proj_modern_residence",
    vendorId: "vendor_5",
    receivedBy: "u_store",
    receivedByName: "Meera Joshi",
    receivedAt: "2026-07-22T06:15:00.000Z",
    notes: "Second delivery — balance of the sanitaryware line received in full.",
    createdAt: "2026-07-22T06:30:00.000Z",
    updatedAt: "2026-07-22T06:30:00.000Z",
  },
];

export const mockGRNLineItems: GRNLineItem[] = [
  // grn_1
  { id: "grnli_1", grnId: "grn_1", purchaseOrderLineItemId: "pli_1", description: "Interior Emulsion Paint", uom: "litre", orderedQuantity: 180, receivedQuantity: 180, rate: 298, brand: "Asian Paints" },
  {
    id: "grnli_2",
    grnId: "grn_1",
    purchaseOrderLineItemId: "pli_2",
    description: "Sanitaryware — Wall-mounted WC Set",
    uom: "each",
    orderedQuantity: 4,
    receivedQuantity: 2,
    rate: 12_100,
    brand: "Cera",
    warrantyCertificateNumber: "CERA-WC-2026-014",
  },
  // grn_2
  {
    id: "grnli_3",
    grnId: "grn_2",
    purchaseOrderLineItemId: "pli_2",
    description: "Sanitaryware — Wall-mounted WC Set",
    uom: "each",
    orderedQuantity: 4,
    receivedQuantity: 2,
    rate: 12_100,
    brand: "Cera",
    warrantyCertificateNumber: "CERA-WC-2026-015",
  },
];

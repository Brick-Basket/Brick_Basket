import type { GRN, GRNLineItem } from "@/types/domain/grn";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/grn-adapter.ts. `grn_1`/`grn_2` both receive
 * against `po_1`, split across two deliveries to demonstrate that a PO's
 * line items can be received in more than one GRN: `grn_1` receives the
 * paint line in full and the sanitaryware line partially (2 of 4); `grn_2`
 * completes the sanitaryware line (the remaining 2).
 *
 * `grn_3`/`grn_4` (added for broader demo coverage, see mock/projects.ts)
 * cover the other shape: `grn_3` against `po_5` is a single complete
 * receipt in one delivery; `grn_4` against `po_8` is a single *partial*
 * receipt (2,000 of 3,200 sq.ft) with no second GRN yet, modeling a
 * delivery still in progress. `grn_3`'s line is tagged with `stockMaterial`
 * (exercising the GRN → Stock Statement reconciliation link); `grn_4`'s
 * isn't, since "Natural Stone Cladding" doesn't map cleanly onto
 * `StockMaterial`'s closed list — see `GRNLineItem.stockMaterial`'s doc
 * comment.
 *
 * `grn_5` (Gorakhpur Business Park) is another single complete receipt,
 * against `po_9` — the only Gorakhpur PO that's actually `"issued"`
 * (`po_10` sits at `"released"`, one step before issue, and therefore
 * correctly has no GRN against it — see mock/purchase-orders.ts).
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
  {
    id: "grn_3",
    grnNumber: "BB-GRN-2026-003",
    purchaseOrderId: "po_5",
    projectId: "proj_riverside_apartments",
    vendorId: "vendor_9",
    receivedBy: "u_store",
    receivedByName: "Meera Joshi",
    receivedAt: "2026-09-02T06:00:00.000Z",
    notes: "Full delivery received in one truck — steel tagged against the Stock Statement's TMT Steel line.",
    createdAt: "2026-09-02T06:30:00.000Z",
    updatedAt: "2026-09-02T06:30:00.000Z",
  },
  {
    id: "grn_4",
    grnNumber: "BB-GRN-2026-004",
    purchaseOrderId: "po_8",
    projectId: "proj_heritage_resort",
    vendorId: "vendor_5",
    receivedBy: "u_store",
    receivedByName: "Meera Joshi",
    receivedAt: "2026-08-14T06:00:00.000Z",
    notes: "First delivery — 2,000 of 3,200 sq.ft received; balance promised once the vendor's next quarry batch clears.",
    createdAt: "2026-08-14T06:30:00.000Z",
    updatedAt: "2026-08-14T06:30:00.000Z",
  },
  {
    id: "grn_5",
    grnNumber: "BB-GRN-2026-005",
    purchaseOrderId: "po_9",
    projectId: "proj_gorakhpur_business_park",
    vendorId: "vendor_11",
    receivedBy: "u_store",
    receivedByName: "Meera Joshi",
    receivedAt: "2026-09-23T06:00:00.000Z",
    notes: "Full delivery received in one truck — steel tagged against the Stock Statement's TMT Steel line.",
    createdAt: "2026-09-23T06:30:00.000Z",
    updatedAt: "2026-09-23T06:30:00.000Z",
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
  // grn_3 — full receipt, tagged for Stock Statement reconciliation
  {
    id: "grnli_4",
    grnId: "grn_3",
    purchaseOrderLineItemId: "pli_6",
    description: "TMT Steel (Fe 500), 10mm",
    uom: "kg",
    orderedQuantity: 2_200,
    receivedQuantity: 2_200,
    rate: 65,
    brand: "Deccan Build (own-brand TMT)",
    stockMaterial: "tmt_steel",
  },
  // grn_4 — partial receipt, untagged (no clean StockMaterial match)
  {
    id: "grnli_5",
    grnId: "grn_4",
    purchaseOrderLineItemId: "pli_9",
    description: "Natural Stone Cladding (Dholpur)",
    uom: "sq.ft",
    orderedQuantity: 3_200,
    receivedQuantity: 2_000,
    rate: 138,
    brand: "Dholpur Stone Co.",
  },
  // grn_5 — full receipt, tagged for Stock Statement reconciliation (Gorakhpur Business Park)
  {
    id: "grnli_6",
    grnId: "grn_5",
    purchaseOrderLineItemId: "pli_10",
    description: "TMT Steel (Fe 500), 16mm",
    uom: "kg",
    orderedQuantity: 2_800,
    receivedQuantity: 2_800,
    rate: 69,
    brand: "Tata Tiscon",
    stockMaterial: "tmt_steel",
  },
];

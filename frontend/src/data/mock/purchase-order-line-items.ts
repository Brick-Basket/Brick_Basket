import type { PurchaseOrderLineItem } from "@/types/domain/purchase-order";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/purchase-orders-adapter.ts. One row per `RFQLine`
 * claimed by each mock PO — `rate` is a snapshot of that vendor's quoted
 * rate on the source RFQ line (see `src/data/mock/rfq-vendor-quotes.ts`).
 */
export const mockPurchaseOrderLineItems: PurchaseOrderLineItem[] = [
  // po_1 — vendor_5's two selected lines on rfq_2
  { id: "pli_1", purchaseOrderId: "po_1", rfqLineId: "rfql_3", description: "Interior Emulsion Paint", uom: "litre", quantity: 180, rate: 298 },
  { id: "pli_2", purchaseOrderId: "po_1", rfqLineId: "rfql_4", description: "Sanitaryware — Wall-mounted WC Set", uom: "each", quantity: 4, rate: 12_100 },

  // po_2 — vendor_1's selected line on rfq_2
  { id: "pli_3", purchaseOrderId: "po_2", rfqLineId: "rfql_5", description: "Masking tape, 24mm", uom: "roll", quantity: 30, rate: 42 },

  // po_3 — vendor_2's selected line on rfq_3
  { id: "pli_4", purchaseOrderId: "po_3", rfqLineId: "rfql_6", description: "PVC Conduit Pipes, 25mm", uom: "meter", quantity: 500, rate: 16 },

  // po_4 — vendor_3's selected line on rfq_3
  { id: "pli_5", purchaseOrderId: "po_4", rfqLineId: "rfql_7", description: "Exterior Textured Paint", uom: "litre", quantity: 90, rate: 55 },

  // po_5 — vendor_9's selected line on rfq_4 (Riverside Apartments)
  { id: "pli_6", purchaseOrderId: "po_5", rfqLineId: "rfql_8", description: "TMT Steel (Fe 500), 10mm", uom: "kg", quantity: 2_200, rate: 65 },

  // po_6 — vendor_3's selected line on rfq_4 (Riverside Apartments)
  { id: "pli_7", purchaseOrderId: "po_6", rfqLineId: "rfql_9", description: "MCB Distribution Board, 8-way", uom: "each", quantity: 6, rate: 1_870 },

  // po_7 — vendor_10's selected line on rfq_5 (Heritage Resort)
  { id: "pli_8", purchaseOrderId: "po_7", rfqLineId: "rfql_10", description: "3-Phase MCB Distribution Panel", uom: "each", quantity: 4, rate: 8_200 },

  // po_8 — vendor_5's selected line on rfq_5 (Heritage Resort)
  { id: "pli_9", purchaseOrderId: "po_8", rfqLineId: "rfql_11", description: "Natural Stone Cladding (Dholpur)", uom: "sq.ft", quantity: 3_200, rate: 138 },

  // po_9 — vendor_11's selected line on rfq_6 (Gorakhpur Business Park)
  { id: "pli_10", purchaseOrderId: "po_9", rfqLineId: "rfql_12", description: "TMT Steel (Fe 500), 16mm", uom: "kg", quantity: 2_800, rate: 69 },

  // po_10 — vendor_2's selected line on rfq_6 (Gorakhpur Business Park)
  { id: "pli_11", purchaseOrderId: "po_10", rfqLineId: "rfql_13", description: "Aluminium Composite Panel (ACP) Cladding", uom: "sq.m", quantity: 450, rate: 2_830 },
];

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
];

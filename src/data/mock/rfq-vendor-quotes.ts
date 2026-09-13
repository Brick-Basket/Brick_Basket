import type { RFQVendorQuote } from "@/types/domain/rfq";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/rfq-adapter.ts. Up to 3 per `RFQLine` (the owner's
 * "Vendor 1/2/3" comparison columns) — `rfql_2` and `rfql_4` deliberately
 * have only 2, to exercise a partially-filled comparison row. All rates
 * are illustrative demo values only, never real vendor pricing.
 */
export const mockRFQVendorQuotes: RFQVendorQuote[] = [
  // rfql_1 — Copper Wiring Cable (ACE ₹46/meter) — 3 quotes, L1 = vendor_3 @ ₹43
  { id: "rfqvq_1", rfqLineId: "rfql_1", vendorId: "vendor_1", rate: 44, quotedAt: "2026-08-08T06:00:00.000Z" },
  { id: "rfqvq_2", rfqLineId: "rfql_1", vendorId: "vendor_3", rate: 43, quotedAt: "2026-08-08T06:15:00.000Z" },
  { id: "rfqvq_3", rfqLineId: "rfql_1", vendorId: "vendor_4", rate: 45, quotedAt: "2026-08-08T06:30:00.000Z" },

  // rfql_2 — Scaffolding coupler clamps (no ACE reference) — 2 of 3 quotes, L1 = vendor_4 @ ₹16
  { id: "rfqvq_4", rfqLineId: "rfql_2", vendorId: "vendor_1", rate: 18, quotedAt: "2026-08-08T06:45:00.000Z" },
  { id: "rfqvq_5", rfqLineId: "rfql_2", vendorId: "vendor_4", rate: 16, quotedAt: "2026-08-08T07:00:00.000Z" },

  // rfql_3 — Interior Emulsion Paint (ACE ₹310/litre) — 3 quotes, L1 = vendor_5 @ ₹298, selected
  { id: "rfqvq_6", rfqLineId: "rfql_3", vendorId: "vendor_5", rate: 298, quotedAt: "2026-07-06T06:00:00.000Z" },
  { id: "rfqvq_7", rfqLineId: "rfql_3", vendorId: "vendor_2", rate: 305, quotedAt: "2026-07-06T06:15:00.000Z" },
  { id: "rfqvq_8", rfqLineId: "rfql_3", vendorId: "vendor_1", rate: 300, quotedAt: "2026-07-06T06:30:00.000Z" },

  // rfql_4 — Sanitaryware WC Set (ACE ₹12,500/each) — 2 of 3 quotes, L1 = vendor_5 @ ₹12,100, selected
  { id: "rfqvq_9", rfqLineId: "rfql_4", vendorId: "vendor_5", rate: 12_100, quotedAt: "2026-07-06T06:45:00.000Z" },
  { id: "rfqvq_10", rfqLineId: "rfql_4", vendorId: "vendor_2", rate: 12_300, quotedAt: "2026-07-06T07:00:00.000Z" },

  // rfql_5 — Masking tape (no ACE reference) — L1 = vendor_2 @ ₹40, but vendor_1 @ ₹42 was selected instead
  { id: "rfqvq_11", rfqLineId: "rfql_5", vendorId: "vendor_1", rate: 42, quotedAt: "2026-07-06T07:15:00.000Z" },
  { id: "rfqvq_12", rfqLineId: "rfql_5", vendorId: "vendor_2", rate: 40, quotedAt: "2026-07-06T07:30:00.000Z" },

  // rfql_6 — PVC Conduit Pipes (no ACE reference, rfq_3) — L1 = vendor_2 @ ₹16, selected
  { id: "rfqvq_13", rfqLineId: "rfql_6", vendorId: "vendor_2", rate: 16, quotedAt: "2026-08-18T06:00:00.000Z" },
  { id: "rfqvq_14", rfqLineId: "rfql_6", vendorId: "vendor_1", rate: 17, quotedAt: "2026-08-18T06:15:00.000Z" },

  // rfql_7 — Exterior Textured Paint (no ACE reference, rfq_3) — L1 = vendor_3 @ ₹55, selected
  { id: "rfqvq_15", rfqLineId: "rfql_7", vendorId: "vendor_3", rate: 55, quotedAt: "2026-08-18T06:30:00.000Z" },
  { id: "rfqvq_16", rfqLineId: "rfql_7", vendorId: "vendor_4", rate: 58, quotedAt: "2026-08-18T06:45:00.000Z" },
];

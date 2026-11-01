import type { RFQVendorQuote } from "@/types/domain/rfq";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/rfq-adapter.ts. Up to 3 per `RFQLine` (the owner's
 * "Vendor 1/2/3" comparison columns) — `rfql_2` and `rfql_4` deliberately
 * have only 2, to exercise a partially-filled comparison row. All rates
 * are illustrative demo values only, never real vendor pricing.
 */
export const mockRFQVendorQuotes: RFQVendorQuote[] = [
  // rfql_1 — Copper Wiring Cable (ACE ₹46/meter, qty 320, RFQ tax 18%) — 3
  // quotes. docs/OPEN_QUESTIONS.md #87(a) demonstration: vendor_3 has the
  // lowest *quoted rate* (₹43) but carries ₹500 freight, so its landed
  // cost (43×320×1.18 + 500 = ₹16,736.80) is actually higher than
  // vendor_1's (44×320×1.18 = ₹16,614.40, no delivery charges on file) —
  // L1 is vendor_1 on landed cost, not vendor_3 on raw rate. This is the
  // scenario landed-cost ranking exists to catch.
  { id: "rfqvq_1", rfqLineId: "rfql_1", vendorId: "vendor_1", rate: 44, quotedAt: "2026-08-08T06:00:00.000Z" },
  { id: "rfqvq_2", rfqLineId: "rfql_1", vendorId: "vendor_3", rate: 43, freight: 500, quotedAt: "2026-08-08T06:15:00.000Z" },
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

  // rfql_8 — TMT Steel 10mm (ACE ₹67/kg, Riverside Apartments) — L1 = vendor_9 @ ₹65, selected
  { id: "rfqvq_17", rfqLineId: "rfql_8", vendorId: "vendor_9", rate: 65, quotedAt: "2026-08-21T06:00:00.000Z" },
  { id: "rfqvq_18", rfqLineId: "rfql_8", vendorId: "vendor_4", rate: 68, quotedAt: "2026-08-21T06:15:00.000Z" },

  // rfql_9 — MCB Distribution Board 8-way (ACE ₹1,950/each, Riverside Apartments) — L1 = vendor_3 @ ₹1,870, selected
  { id: "rfqvq_19", rfqLineId: "rfql_9", vendorId: "vendor_3", rate: 1_870, quotedAt: "2026-08-21T06:30:00.000Z" },
  { id: "rfqvq_20", rfqLineId: "rfql_9", vendorId: "vendor_1", rate: 1_920, quotedAt: "2026-08-21T06:45:00.000Z" },

  // rfql_10 — 3-Phase MCB Distribution Panel (ACE ₹8,500/each, Heritage Resort) — L1 = vendor_10 @ ₹8,200, selected
  { id: "rfqvq_21", rfqLineId: "rfql_10", vendorId: "vendor_10", rate: 8_200, quotedAt: "2026-07-31T06:00:00.000Z" },
  { id: "rfqvq_22", rfqLineId: "rfql_10", vendorId: "vendor_1", rate: 8_450, quotedAt: "2026-07-31T06:15:00.000Z" },

  // rfql_11 — Natural Stone Cladding (ACE ₹145/sq.ft, Heritage Resort) — L1 = vendor_5 @ ₹138, selected
  { id: "rfqvq_23", rfqLineId: "rfql_11", vendorId: "vendor_5", rate: 138, quotedAt: "2026-07-31T06:30:00.000Z" },
  { id: "rfqvq_24", rfqLineId: "rfql_11", vendorId: "vendor_2", rate: 142, quotedAt: "2026-07-31T06:45:00.000Z" },

  // rfql_12 — TMT Steel 16mm (ACE ₹70/kg, Gorakhpur Business Park) — L1 = vendor_11 @ ₹69, selected
  { id: "rfqvq_25", rfqLineId: "rfql_12", vendorId: "vendor_11", rate: 69, quotedAt: "2026-09-18T06:00:00.000Z" },
  { id: "rfqvq_26", rfqLineId: "rfql_12", vendorId: "vendor_4", rate: 72, quotedAt: "2026-09-18T06:15:00.000Z" },

  // rfql_13 — ACP Cladding (ACE ₹2,850/sq.m, Gorakhpur Business Park) — L1 = vendor_2 @ ₹2,830, selected
  { id: "rfqvq_27", rfqLineId: "rfql_13", vendorId: "vendor_2", rate: 2_830, quotedAt: "2026-09-18T06:30:00.000Z" },
  { id: "rfqvq_28", rfqLineId: "rfql_13", vendorId: "vendor_6", rate: 2_900, quotedAt: "2026-09-18T06:45:00.000Z" },
];

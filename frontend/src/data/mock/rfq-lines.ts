import type { RFQLine } from "@/types/domain/rfq";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/rfq-adapter.ts. One row per source requisition
 * line (see `src/data/mock/material-requirements.ts`) — `aceRate` is a
 * snapshot of the linked `ACEItem.rate` at the time these were seeded,
 * `null` for the `"additional"` free-entry lines that have no ACE
 * reference (`mr_6`, `mr_12`).
 */
export const mockRFQLines: RFQLine[] = [
  // rfq_1 — draft, from req_3
  {
    id: "rfql_1",
    rfqId: "rfq_1",
    materialRequirementId: "mr_5",
    description: "2.5 sq.mm Copper Wiring Cable",
    uom: "meter",
    quantity: 320,
    aceItemId: "ace_3",
    aceRate: 46,
    selectedVendorId: null,
  },
  {
    id: "rfql_2",
    rfqId: "rfq_1",
    materialRequirementId: "mr_6",
    description: "Scaffolding coupler clamps",
    uom: "each",
    quantity: 150,
    aceRate: null,
    selectedVendorId: null,
  },

  // rfq_2 — finalized, from req_6
  {
    id: "rfql_3",
    rfqId: "rfq_2",
    materialRequirementId: "mr_10",
    description: "Interior Emulsion Paint",
    uom: "litre",
    quantity: 180,
    aceItemId: "ace_10",
    aceRate: 310,
    selectedVendorId: "vendor_5",
  },
  {
    id: "rfql_4",
    rfqId: "rfq_2",
    materialRequirementId: "mr_11",
    description: "Sanitaryware — Wall-mounted WC Set",
    uom: "each",
    quantity: 4,
    aceItemId: "ace_11",
    aceRate: 12_500,
    selectedVendorId: "vendor_5",
  },
  {
    id: "rfql_5",
    rfqId: "rfq_2",
    materialRequirementId: "mr_12",
    description: "Masking tape, 24mm",
    uom: "roll",
    quantity: 30,
    aceRate: null,
    // Deliberately NOT the L1 vendor (vendor_2 @ ₹40) — the purchaser can
    // select any quoted vendor, not only the lowest, e.g. for stock/lead
    // time reasons the frontend doesn't model. Demonstrates L1 highlighting
    // and vendor selection are independent, per the owner's framing of L1
    // as a *computed* indicator, not an enforced choice.
    selectedVendorId: "vendor_1",
  },

  // rfq_3 — finalized, from req_7 (added in Part 10, two distinct vendor
  // groups so Purchase Orders has two more finalized-RFQ vendor groups to
  // draw from, alongside rfq_2's two groups)
  {
    id: "rfql_6",
    rfqId: "rfq_3",
    materialRequirementId: "mr_13",
    description: "PVC Conduit Pipes, 25mm",
    uom: "meter",
    quantity: 500,
    aceRate: null,
    selectedVendorId: "vendor_2",
  },
  {
    id: "rfql_7",
    rfqId: "rfq_3",
    materialRequirementId: "mr_14",
    description: "Exterior Textured Paint",
    uom: "litre",
    quantity: 90,
    aceRate: null,
    selectedVendorId: "vendor_3",
  },

  // rfq_4 — finalized, from req_8 (Riverside Apartments)
  {
    id: "rfql_8",
    rfqId: "rfq_4",
    materialRequirementId: "mr_15",
    description: "TMT Steel (Fe 500), 10mm",
    uom: "kg",
    quantity: 2_200,
    aceItemId: "ace_14",
    aceRate: 67,
    selectedVendorId: "vendor_9",
  },
  {
    id: "rfql_9",
    rfqId: "rfq_4",
    materialRequirementId: "mr_16",
    description: "MCB Distribution Board, 8-way",
    uom: "each",
    quantity: 6,
    aceItemId: "ace_15",
    aceRate: 1_950,
    selectedVendorId: "vendor_3",
  },

  // rfq_5 — finalized, from req_10 (Heritage Resort)
  {
    id: "rfql_10",
    rfqId: "rfq_5",
    materialRequirementId: "mr_19",
    description: "3-Phase MCB Distribution Panel",
    uom: "each",
    quantity: 4,
    aceItemId: "ace_18",
    aceRate: 8_500,
    selectedVendorId: "vendor_10",
  },
  {
    id: "rfql_11",
    rfqId: "rfq_5",
    materialRequirementId: "mr_20",
    description: "Natural Stone Cladding (Dholpur)",
    uom: "sq.ft",
    quantity: 3_200,
    aceItemId: "ace_17",
    aceRate: 145,
    selectedVendorId: "vendor_5",
  },

  // rfq_6 — finalized, from req_12 (Gorakhpur Business Park)
  {
    id: "rfql_12",
    rfqId: "rfq_6",
    materialRequirementId: "mr_22",
    description: "TMT Steel (Fe 500), 16mm",
    uom: "kg",
    quantity: 2_800,
    aceItemId: "ace_22",
    aceRate: 70,
    selectedVendorId: "vendor_11",
  },
  {
    id: "rfql_13",
    rfqId: "rfq_6",
    materialRequirementId: "mr_23",
    description: "Aluminium Composite Panel (ACP) Cladding",
    uom: "sq.m",
    quantity: 450,
    aceItemId: "ace_23",
    aceRate: 2_850,
    selectedVendorId: "vendor_2",
  },
];

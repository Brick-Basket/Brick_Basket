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
];

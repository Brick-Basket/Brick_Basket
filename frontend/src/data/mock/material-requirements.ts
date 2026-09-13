import type { MaterialRequirement } from "@/types/domain/requisition";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/requisitions-adapter.ts. Every requisition has at
 * least one `"predefined"` line (linked to an `ACEItem` via `aceItemId`)
 * and most also have an `"additional"` free-entry line, exercising both
 * paths the owner requirements name.
 */
export const mockMaterialRequirements: MaterialRequirement[] = [
  // req_1 — draft
  { id: "mr_1", requisitionId: "req_1", source: "predefined", aceItemId: "ace_1", description: "TMT Steel (Fe 500), 12mm", uom: "kg", quantity: 850 },
  { id: "mr_2", requisitionId: "req_1", source: "additional", description: "Plywood shuttering sheets, 12mm", uom: "sheet", quantity: 40, brand: "Century Ply" },

  // req_2 — submitted
  { id: "mr_3", requisitionId: "req_2", source: "predefined", aceItemId: "ace_2", description: "OPC 53-grade Cement", uom: "bag (50kg)", quantity: 120 },
  { id: "mr_4", requisitionId: "req_2", source: "predefined", aceItemId: "ace_4", description: "CPVC Pipe, 1 inch", uom: "meter", quantity: 60 },

  // req_3 — approved
  { id: "mr_5", requisitionId: "req_3", source: "predefined", aceItemId: "ace_3", description: "2.5 sq.mm Copper Wiring Cable", uom: "meter", quantity: 320, brand: "Polycab" },
  { id: "mr_6", requisitionId: "req_3", source: "additional", description: "Scaffolding coupler clamps", uom: "each", quantity: 150 },

  // req_4 — rejected
  { id: "mr_7", requisitionId: "req_4", source: "predefined", aceItemId: "ace_7", description: "M-Sand (river-sand alternative)", uom: "cu.ft", quantity: 900 },

  // req_5 — submitted
  { id: "mr_8", requisitionId: "req_5", source: "predefined", aceItemId: "ace_8", description: "HVAC Ducting, GI Sheet 24-gauge", uom: "sq.ft", quantity: 1_200 },
  { id: "mr_9", requisitionId: "req_5", source: "predefined", aceItemId: "ace_9", description: "MCB Distribution Board, 12-way", uom: "each", quantity: 3, brand: "Schneider Electric" },

  // req_6 — approved
  { id: "mr_10", requisitionId: "req_6", source: "predefined", aceItemId: "ace_10", description: "Interior Emulsion Paint", uom: "litre", quantity: 180, brand: "Asian Paints" },
  { id: "mr_11", requisitionId: "req_6", source: "predefined", aceItemId: "ace_11", description: "Sanitaryware — Wall-mounted WC Set", uom: "each", quantity: 4 },
  { id: "mr_12", requisitionId: "req_6", source: "additional", description: "Masking tape, 24mm", uom: "roll", quantity: 30 },

  // req_7 — approved (feeds RFQ Management Part 9 → Purchase Orders Part 10)
  { id: "mr_13", requisitionId: "req_7", source: "additional", description: "PVC Conduit Pipes, 25mm", uom: "meter", quantity: 500 },
  { id: "mr_14", requisitionId: "req_7", source: "additional", description: "Exterior Textured Paint", uom: "litre", quantity: 90, brand: "Asian Paints" },
];

import type { RFQ } from "@/types/domain/rfq";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/rfq-adapter.ts. One RFQ per approved mock
 * requisition (`req_3`, `req_6` — see `src/data/mock/requisitions.ts`):
 * `rfq_1` is still `"draft"` (comparison in progress, no vendor selected
 * yet), `rfq_2` is `"finalized"` (every line has a selected vendor).
 *
 * All monetary values below are clearly demo/mock figures for UI
 * demonstration only — never real vendor pricing. See the owner
 * requirements' explicit instruction in
 * `BrickBasket_Master_Frontend_Prompt_v6.1` §5C.
 *
 * `rfq_3` (from `req_7`) is also `"finalized"` — added in Part 10 as the
 * source for two more mock Purchase Orders, alongside `rfq_2`'s two vendor
 * groups.
 */
export const mockRFQs: RFQ[] = [
  {
    id: "rfq_1",
    rfqNumber: "BB-RFQ-2026-001",
    requisitionId: "req_3",
    projectId: "proj_luxury_villa",
    status: "draft",
    taxPercent: 18,
    preparedBy: "u_purchaser",
    preparedByName: "Vikram Nair",
    finalizedAt: null,
    createdAt: "2026-08-07T05:00:00.000Z",
    updatedAt: "2026-08-07T05:00:00.000Z",
  },
  {
    id: "rfq_2",
    rfqNumber: "BB-RFQ-2026-002",
    requisitionId: "req_6",
    projectId: "proj_modern_residence",
    status: "finalized",
    taxPercent: 18,
    preparedBy: "u_purchaser",
    preparedByName: "Vikram Nair",
    finalizedAt: "2026-07-10T07:00:00.000Z",
    createdAt: "2026-07-05T05:00:00.000Z",
    updatedAt: "2026-07-10T07:00:00.000Z",
  },
  {
    id: "rfq_3",
    rfqNumber: "BB-RFQ-2026-003",
    requisitionId: "req_7",
    projectId: "proj_commercial_complex",
    status: "finalized",
    taxPercent: 18,
    preparedBy: "u_purchaser",
    preparedByName: "Vikram Nair",
    finalizedAt: "2026-08-20T07:00:00.000Z",
    createdAt: "2026-08-17T05:00:00.000Z",
    updatedAt: "2026-08-20T07:00:00.000Z",
  },
  // rfq_4/rfq_5 — from req_8 (Riverside Apartments) and req_10 (Heritage
  // Resort), added for broader demo coverage alongside mock/projects.ts'
  // two new projects. Both finalized, each with two vendor groups, so
  // Purchase Orders (Part 10) has two more finalized RFQs to draw from.
  {
    id: "rfq_4",
    rfqNumber: "BB-RFQ-2026-004",
    requisitionId: "req_8",
    projectId: "proj_riverside_apartments",
    status: "finalized",
    taxPercent: 18,
    preparedBy: "u_purchaser",
    preparedByName: "Vikram Nair",
    finalizedAt: "2026-08-25T07:00:00.000Z",
    createdAt: "2026-08-20T05:00:00.000Z",
    updatedAt: "2026-08-25T07:00:00.000Z",
  },
  {
    id: "rfq_5",
    rfqNumber: "BB-RFQ-2026-005",
    requisitionId: "req_10",
    projectId: "proj_heritage_resort",
    status: "finalized",
    taxPercent: 18,
    preparedBy: "u_purchaser",
    preparedByName: "Vikram Nair",
    finalizedAt: "2026-08-02T07:00:00.000Z",
    createdAt: "2026-07-30T05:00:00.000Z",
    updatedAt: "2026-08-02T07:00:00.000Z",
  },
  // rfq_6 — from req_12 (Gorakhpur Business Park), added for broader demo
  // coverage alongside mock/projects.ts' third new project. Finalized,
  // with two vendor groups, so Purchase Orders has another finalized RFQ
  // to draw from — this time used to cover the "approved"/"released" PO
  // states that po_1–8 never exercised (see mock/purchase-orders.ts).
  {
    id: "rfq_6",
    rfqNumber: "BB-RFQ-2026-006",
    requisitionId: "req_12",
    projectId: "proj_gorakhpur_business_park",
    status: "finalized",
    taxPercent: 18,
    preparedBy: "u_purchaser",
    preparedByName: "Vikram Nair",
    finalizedAt: "2026-09-19T07:00:00.000Z",
    createdAt: "2026-09-17T05:00:00.000Z",
    updatedAt: "2026-09-19T07:00:00.000Z",
  },
];

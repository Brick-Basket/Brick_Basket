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
];

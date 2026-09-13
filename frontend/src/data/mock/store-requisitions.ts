import type { StoreRequisition } from "@/types/domain/store-requisition";

/**
 * Mock/demo only — covers every status (draft/submitted/approved/rejected/
 * issued) across 2 projects and 2 requester roles (`project_manager`,
 * `site_engineer`), so every filter/action combination has something real
 * to show. See `src/types/domain/store-requisition.ts`'s header comment.
 *
 * IDs use the `storereq_N` prefix (not `mr_N`, despite the "MR" shorthand
 * this module's own `requisitionNumber` field uses) deliberately — a Phase
 * 23 quality-gate fix. `mr_N` already names `material-requirements.ts`'s
 * entirely different `MaterialRequirement` entity (sub-line-items of a
 * Purchase/Material Requisition); the two are never rendered together
 * today, but reusing the same literal IDs across two unrelated entity
 * types is exactly the kind of accidental collision that becomes a real
 * bug the moment either type is ever keyed, cached, or looked up outside
 * its own dedicated adapter.
 */
export const mockStoreRequisitions: StoreRequisition[] = [
  {
    id: "storereq_1",
    projectId: "proj_modern_residence",
    requisitionNumber: "MR-0001",
    requestedBy: "u_engineer",
    requestedByName: "Sana Iqbal",
    requestDate: "2026-08-20",
    material: "cement",
    uom: "bags",
    requestedQuantity: 150,
    approvedIssuedQuantity: 150,
    status: "issued",
    remarks: "For ground floor slab pour, block A.",
    storeRemarks: "Issued in full from existing stock.",
    issueDate: "2026-08-21",
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-21T14:00:00.000Z",
  },
  {
    id: "storereq_2",
    projectId: "proj_modern_residence",
    requisitionNumber: "MR-0002",
    requestedBy: "u_pm",
    requestedByName: "Karan Mehta",
    requestDate: "2026-09-01",
    material: "tmt_steel",
    uom: "kg",
    requestedQuantity: 2000,
    approvedIssuedQuantity: 1500,
    status: "approved",
    remarks: "Column reinforcement, first floor.",
    storeRemarks: "Only 1500kg of this diameter in stock — balance to follow once the next GRN clears.",
    createdAt: "2026-09-01T10:30:00.000Z",
    updatedAt: "2026-09-02T11:00:00.000Z",
  },
  {
    id: "storereq_3",
    projectId: "proj_luxury_villa",
    requisitionNumber: "MR-0003",
    requestedBy: "u_engineer",
    requestedByName: "Sana Iqbal",
    requestDate: "2026-09-05",
    material: "sand",
    uom: "cubic ft",
    requestedQuantity: 500,
    status: "submitted",
    remarks: "Plastering, external walls.",
    createdAt: "2026-09-05T08:15:00.000Z",
    updatedAt: "2026-09-05T08:15:00.000Z",
  },
  {
    id: "storereq_4",
    projectId: "proj_luxury_villa",
    requisitionNumber: "MR-0004",
    requestedBy: "u_pm",
    requestedByName: "Karan Mehta",
    requestDate: "2026-09-08",
    material: "other",
    otherMaterialName: "PVC conduit pipes (25mm)",
    uom: "meters",
    requestedQuantity: 300,
    status: "rejected",
    remarks: "Electrical conduit routing, first floor.",
    storeRemarks: "Not in stock at all — raise a Purchase Requisition instead, this can't be issued from Stores.",
    createdAt: "2026-09-08T13:00:00.000Z",
    updatedAt: "2026-09-09T09:00:00.000Z",
  },
  {
    id: "storereq_5",
    projectId: "proj_modern_residence",
    requisitionNumber: "MR-0005",
    requestedBy: "u_engineer",
    requestedByName: "Sana Iqbal",
    requestDate: "2026-09-10",
    material: "bricks",
    uom: "nos",
    requestedQuantity: 5000,
    status: "draft",
    remarks: "Second floor brickwork — draft, not yet sent to Stores.",
    createdAt: "2026-09-10T16:00:00.000Z",
    updatedAt: "2026-09-10T16:00:00.000Z",
  },
];

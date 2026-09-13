import type {
  CreateStoreRequisitionInput,
  StoreRequisition,
  StoreRequisitionDecisionInput,
  StoreRequisitionStatus,
  UpdateStoreRequisitionInput,
} from "@/types/domain/store-requisition";
import { mockStoreRequisitions } from "@/data/mock/store-requisitions";

/**
 * Adapter boundary for Store Material Requisition ("MR", §6B — see
 * `src/types/domain/store-requisition.ts`'s header comment for the full
 * scope decision and why this is a separate module from Purchase
 * Requisition, Part 8). Components/hooks depend on this interface, never
 * on the concrete implementation below — swapping to a real backend means
 * adding `store-requisitions-adapter.rest.ts` implementing the same
 * interface and changing the single export at the bottom of this file.
 *
 * Backend contract:
 *   GET    /api/store-requisitions                — list, filtered by project/status/requestedBy
 *   GET    /api/store-requisitions/:id             — detail
 *   POST   /api/store-requisitions                 — create (store_requisitions:create, status: "draft")
 *   PATCH  /api/store-requisitions/:id              — edit (store_requisitions:create, only while draft/rejected)
 *   POST   /api/store-requisitions/:id/submit       — submit for Stores review (store_requisitions:create)
 *   POST   /api/store-requisitions/:id/decide       — approve or reject (store_requisitions:action)
 *   POST   /api/store-requisitions/:id/issue        — record actual issuance (store_requisitions:action)
 */
export interface StoreRequisitionActor {
  id: string;
  name: string;
}

export interface StoreRequisitionListParams {
  search?: string;
  status?: StoreRequisitionStatus;
  projectId?: string;
  requestedBy?: string;
  sortBy?: "createdAt" | "updatedAt" | "status" | "requisitionNumber" | "requestDate";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StoreRequisitionListResult {
  items: StoreRequisition[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StoreRequisitionsAdapter {
  list(params?: StoreRequisitionListParams): Promise<StoreRequisitionListResult>;
  get(id: string): Promise<StoreRequisition | null>;
  create(input: CreateStoreRequisitionInput, actor: StoreRequisitionActor): Promise<StoreRequisition>;
  update(id: string, patch: UpdateStoreRequisitionInput, actor: StoreRequisitionActor): Promise<StoreRequisition>;
  submit(id: string, actor: StoreRequisitionActor): Promise<StoreRequisition>;
  decide(
    id: string,
    decision: "approved" | "rejected",
    input: StoreRequisitionDecisionInput,
    actor: StoreRequisitionActor,
  ): Promise<StoreRequisition>;
  /**
   * Records actual issuance — only valid once `status === "approved"`.
   *
   * MOCK-ONLY BEHAVIOR, NOT THE REAL CONTRACT: this method only flips
   * `status`/`issueDate` on the in-memory record. A real backend's
   * `POST /api/store-requisitions/:id/issue` must instead perform, as one
   * atomic transaction: (1) re-verify `status === "approved"` server-side,
   * (2) verify `approvedIssuedQuantity` is set and positive, (3) verify
   * real-time stock availability, (4) write the actual stock-consumption/
   * movement record, (5) mark this record issued, (6) set `issueDate`
   * server-side, (7) record the authenticated actor, (8) commit all of the
   * above together or none of it. See `docs/API_CONTRACTS.md`'s
   * `POST /api/store-requisitions/:id/issue` section for the full 8-step
   * contract (BrickBasket final hardening pass). The frontend must never
   * become the authority for stock truth — that check belongs to the real
   * backend transaction, not to anything this adapter or its caller
   * predicts client-side.
   */
  issue(id: string, actor: StoreRequisitionActor): Promise<StoreRequisition>;
}

class MockStoreRequisitionsAdapter implements StoreRequisitionsAdapter {
  private requisitions: StoreRequisition[] = [...mockStoreRequisitions];

  async list(params: StoreRequisitionListParams = {}): Promise<StoreRequisitionListResult> {
    await delay(300);
    let items = [...this.requisitions];

    if (params.projectId) items = items.filter((r) => r.projectId === params.projectId);
    if (params.status) items = items.filter((r) => r.status === params.status);
    if (params.requestedBy) items = items.filter((r) => r.requestedBy === params.requestedBy);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (r) => r.requisitionNumber.toLowerCase().includes(q) || (r.remarks ?? "").toLowerCase().includes(q),
      );
    }

    const sortBy = params.sortBy ?? "createdAt";
    const sortDir = params.sortDir ?? "desc";
    items.sort((a, b) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  async get(id: string): Promise<StoreRequisition | null> {
    await delay(200);
    return this.requisitions.find((r) => r.id === id) ?? null;
  }

  async create(input: CreateStoreRequisitionInput, actor: StoreRequisitionActor): Promise<StoreRequisition> {
    await delay(450);
    this.assertOtherMaterialName(input.material, input.otherMaterialName);
    const now = new Date().toISOString();
    const requisition: StoreRequisition = {
      id: `mr_${Math.random().toString(36).slice(2, 10)}`,
      requisitionNumber: `MR-${String(this.requisitions.length + 1).padStart(4, "0")}`,
      projectId: input.projectId,
      requestedBy: actor.id,
      requestedByName: actor.name,
      requestDate: input.requestDate,
      material: input.material,
      otherMaterialName: input.otherMaterialName,
      uom: input.uom,
      requestedQuantity: input.requestedQuantity,
      status: "draft",
      remarks: input.remarks,
      createdAt: now,
      updatedAt: now,
    };
    this.requisitions = [requisition, ...this.requisitions];
    return requisition;
  }

  async update(id: string, patch: UpdateStoreRequisitionInput, actor: StoreRequisitionActor): Promise<StoreRequisition> {
    await delay(400);
    const requisition = this.mustFind(id);
    if (requisition.status !== "draft" && requisition.status !== "rejected") {
      throw new Error("This request can no longer be edited — only draft or rejected requests can be updated.");
    }
    if (patch.material !== undefined) {
      this.assertOtherMaterialName(patch.material, patch.otherMaterialName ?? requisition.otherMaterialName);
    }
    // Revising a rejected request resets it to "draft" — the same
    // decline-then-revise precedent as Contract (Part 5) and Purchase
    // Requisition (Part 8), so it has a normal path back to "Submit"
    // rather than a dead end.
    const wasRejected = requisition.status === "rejected";
    const updated: StoreRequisition = {
      ...requisition,
      ...(patch.requestDate !== undefined ? { requestDate: patch.requestDate } : {}),
      ...(patch.material !== undefined ? { material: patch.material } : {}),
      ...(patch.otherMaterialName !== undefined ? { otherMaterialName: patch.otherMaterialName } : {}),
      ...(patch.uom !== undefined ? { uom: patch.uom } : {}),
      ...(patch.requestedQuantity !== undefined ? { requestedQuantity: patch.requestedQuantity } : {}),
      ...(patch.remarks !== undefined ? { remarks: patch.remarks } : {}),
      ...(wasRejected ? { status: "draft" as const, storeRemarks: undefined } : {}),
      updatedAt: new Date().toISOString(),
    };
    void actor; // no audit log for this module — see header comment
    this.replace(updated);
    return updated;
  }

  async submit(id: string, _actor: StoreRequisitionActor): Promise<StoreRequisition> {
    await delay(400);
    const requisition = this.mustFind(id);
    if (requisition.status !== "draft") {
      throw new Error("Only a draft request can be submitted.");
    }
    const updated: StoreRequisition = { ...requisition, status: "submitted", updatedAt: new Date().toISOString() };
    this.replace(updated);
    return updated;
  }

  async decide(
    id: string,
    decision: "approved" | "rejected",
    input: StoreRequisitionDecisionInput,
    _actor: StoreRequisitionActor,
  ): Promise<StoreRequisition> {
    await delay(450);
    const requisition = this.mustFind(id);
    if (requisition.status !== "submitted") {
      throw new Error("This request is not currently awaiting a Stores decision.");
    }
    if (decision === "approved" && (input.approvedIssuedQuantity === undefined || input.approvedIssuedQuantity <= 0)) {
      throw new Error("Approving a request requires the quantity Stores will actually issue.");
    }
    const updated: StoreRequisition = {
      ...requisition,
      status: decision,
      approvedIssuedQuantity: decision === "approved" ? input.approvedIssuedQuantity : undefined,
      storeRemarks: input.storeRemarks,
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return updated;
  }

  async issue(id: string, _actor: StoreRequisitionActor): Promise<StoreRequisition> {
    // MOCK-ONLY: this in-memory implementation only checks/updates this one
    // record. It deliberately does NOT verify real stock availability,
    // does NOT write a stock-consumption/movement record, and does NOT
    // persist `_actor` anywhere (the mock `StoreRequisition` type has no
    // field for it) — none of that can be simulated meaningfully against
    // an in-memory array with no real stock ledger behind it. See this
    // interface method's own doc comment above and
    // `docs/API_CONTRACTS.md`'s `/issue` section for the full atomic
    // backend transaction a real implementation of this endpoint must
    // perform instead.
    await delay(400);
    const requisition = this.mustFind(id);
    if (requisition.status !== "approved") {
      throw new Error("Only an approved request can be issued.");
    }
    const updated: StoreRequisition = {
      ...requisition,
      status: "issued",
      issueDate: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return updated;
  }

  private assertOtherMaterialName(material: string, otherMaterialName: string | undefined): void {
    if (material === "other" && !otherMaterialName?.trim()) {
      throw new Error('A material name is required when "Other" is selected.');
    }
  }

  private mustFind(id: string): StoreRequisition {
    const requisition = this.requisitions.find((r) => r.id === id);
    if (!requisition) throw new Error("Store requisition not found.");
    return requisition;
  }

  private replace(updated: StoreRequisition) {
    this.requisitions = this.requisitions.map((r) => (r.id === updated.id ? updated : r));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const storeRequisitionsAdapter: StoreRequisitionsAdapter = new MockStoreRequisitionsAdapter();

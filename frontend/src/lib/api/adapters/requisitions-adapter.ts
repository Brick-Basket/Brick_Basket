import type {
  CreatePurchaseRequisitionInput,
  MaterialRequirement,
  PurchaseRequisition,
  PurchaseRequisitionStatus,
  UpdatePurchaseRequisitionInput,
} from "@/types/domain/requisition";
import type { RequisitionAuditEntry } from "@/types/domain/requisition-audit";
import { mockRequisitions } from "@/data/mock/requisitions";
import { mockMaterialRequirements } from "@/data/mock/material-requirements";
import { mockRequisitionAudit } from "@/data/mock/requisition-audit";

/**
 * Adapter boundary for the Purchase/Material Requisition module.
 * Components/hooks depend on this interface, never on the concrete
 * implementation below — swapping to a real backend means adding
 * `requisitions-adapter.rest.ts` implementing the same interface and
 * changing the single export at the bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 8) for full detail:
 *   GET    /api/requisitions                  — list, filtered by project/status/requestedBy
 *   GET    /api/requisitions/:id               — detail
 *   GET    /api/requisitions/:id/lines          — this requisition's MaterialRequirement lines
 *   POST   /api/requisitions                   — create (requisitions:create, status: "draft")
 *   PATCH  /api/requisitions/:id                — edit (requisitions:create, only while draft/rejected)
 *   POST   /api/requisitions/:id/submit         — submit for review (requisitions:create)
 *   POST   /api/requisitions/:id/decide         — approve or reject (requisitions:approve)
 *   GET    /api/requisitions/:id/audit          — history
 */
export interface RequisitionActor {
  id: string;
  name: string;
}

export interface RequisitionListParams {
  search?: string;
  status?: PurchaseRequisitionStatus;
  projectId?: string;
  requestedBy?: string;
  sortBy?: "createdAt" | "updatedAt" | "status" | "requisitionNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface RequisitionListResult {
  items: PurchaseRequisition[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RequisitionsAdapter {
  list(params?: RequisitionListParams): Promise<RequisitionListResult>;
  get(id: string): Promise<PurchaseRequisition | null>;
  listLines(requisitionId: string): Promise<MaterialRequirement[]>;
  create(input: CreatePurchaseRequisitionInput, actor: RequisitionActor): Promise<PurchaseRequisition>;
  update(id: string, patch: UpdatePurchaseRequisitionInput, actor: RequisitionActor): Promise<PurchaseRequisition>;
  submit(id: string, actor: RequisitionActor): Promise<PurchaseRequisition>;
  decide(id: string, decision: "approved" | "rejected", actor: RequisitionActor, rejectReason?: string): Promise<PurchaseRequisition>;
  listAuditHistory(requisitionId: string): Promise<RequisitionAuditEntry[]>;
}

class MockRequisitionsAdapter implements RequisitionsAdapter {
  private requisitions: PurchaseRequisition[] = [...mockRequisitions];
  private lines: MaterialRequirement[] = [...mockMaterialRequirements];
  private audit: RequisitionAuditEntry[] = [...mockRequisitionAudit];

  async list(params: RequisitionListParams = {}): Promise<RequisitionListResult> {
    await delay(300);
    let items = [...this.requisitions];

    if (params.projectId) items = items.filter((r) => r.projectId === params.projectId);
    if (params.status) items = items.filter((r) => r.status === params.status);
    if (params.requestedBy) items = items.filter((r) => r.requestedBy === params.requestedBy);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((r) => r.requisitionNumber.toLowerCase().includes(q) || (r.notes ?? "").toLowerCase().includes(q));
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

  async get(id: string): Promise<PurchaseRequisition | null> {
    await delay(200);
    return this.requisitions.find((r) => r.id === id) ?? null;
  }

  async listLines(requisitionId: string): Promise<MaterialRequirement[]> {
    await delay(200);
    return this.lines.filter((l) => l.requisitionId === requisitionId);
  }

  async create(input: CreatePurchaseRequisitionInput, actor: RequisitionActor): Promise<PurchaseRequisition> {
    await delay(500);
    const now = new Date().toISOString();
    const requisition: PurchaseRequisition = {
      id: `req_${Math.random().toString(36).slice(2, 10)}`,
      requisitionNumber: `BB-REQ-${new Date().getFullYear()}-${String(this.requisitions.length + 1).padStart(3, "0")}`,
      projectId: input.projectId,
      requestedBy: actor.id,
      requestedByName: actor.name,
      status: "draft",
      notes: input.notes,
      submittedAt: null,
      decidedAt: null,
      rejectReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.requisitions = [requisition, ...this.requisitions];
    this.setLines(requisition.id, input.lines);
    this.pushAudit(requisition.id, "created", "Requisition created.", actor);
    return requisition;
  }

  async update(id: string, patch: UpdatePurchaseRequisitionInput, actor: RequisitionActor): Promise<PurchaseRequisition> {
    await delay(400);
    const requisition = this.mustFind(id);
    if (requisition.status !== "draft" && requisition.status !== "rejected") {
      throw new Error("This requisition can no longer be edited — only draft or rejected requisitions can be updated.");
    }
    // Revising a rejected requisition resets it to "draft" — same
    // FRONTEND IMPLEMENTATION DECISION as Contract's decline-then-revise
    // handling (Part 5), so a revised requisition has a normal path back
    // to "Submit" rather than a dead end. See docs/OPEN_QUESTIONS.md #29.
    const wasRejected = requisition.status === "rejected";
    const updated: PurchaseRequisition = {
      ...requisition,
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(wasRejected ? { status: "draft" as const, decidedAt: null, rejectReason: null } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    if (patch.lines) this.setLines(id, patch.lines);
    this.pushAudit(
      id,
      "updated",
      wasRejected ? "Requisition revised after rejection — reset to draft, ready to submit again." : "Requisition details updated.",
      actor,
    );
    return updated;
  }

  async submit(id: string, actor: RequisitionActor): Promise<PurchaseRequisition> {
    await delay(400);
    const requisition = this.mustFind(id);
    if (requisition.status !== "draft") {
      throw new Error("Only a draft requisition can be submitted.");
    }
    const updated: PurchaseRequisition = { ...requisition, status: "submitted", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.replace(updated);
    this.pushAudit(id, "submitted", "Submitted for review.", actor);
    return updated;
  }

  async decide(id: string, decision: "approved" | "rejected", actor: RequisitionActor, rejectReason?: string): Promise<PurchaseRequisition> {
    await delay(450);
    const requisition = this.mustFind(id);
    if (requisition.status !== "submitted") {
      throw new Error("This requisition is not currently awaiting review.");
    }
    const updated: PurchaseRequisition = {
      ...requisition,
      status: decision,
      decidedAt: new Date().toISOString(),
      rejectReason: decision === "rejected" ? rejectReason ?? null : null,
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    this.pushAudit(
      id,
      decision,
      decision === "approved" ? `Approved by ${actor.name}.` : `Rejected by ${actor.name}${rejectReason ? `: ${rejectReason}` : "."}`,
      actor,
    );
    return updated;
  }

  async listAuditHistory(requisitionId: string): Promise<RequisitionAuditEntry[]> {
    await delay(250);
    return this.audit.filter((a) => a.requisitionId === requisitionId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  private setLines(requisitionId: string, lines: Omit<MaterialRequirement, "id" | "requisitionId">[]) {
    const newLines: MaterialRequirement[] = lines.map((l) => ({
      ...l,
      id: `mr_${Math.random().toString(36).slice(2, 10)}`,
      requisitionId,
    }));
    this.lines = [...this.lines.filter((l) => l.requisitionId !== requisitionId), ...newLines];
  }

  private mustFind(id: string): PurchaseRequisition {
    const requisition = this.requisitions.find((r) => r.id === id);
    if (!requisition) throw new Error("Requisition not found.");
    return requisition;
  }

  private replace(updated: PurchaseRequisition) {
    this.requisitions = this.requisitions.map((r) => (r.id === updated.id ? updated : r));
  }

  private pushAudit(requisitionId: string, action: RequisitionAuditEntry["action"], message: string, actor: RequisitionActor) {
    const entry: RequisitionAuditEntry = {
      id: `raud_${Math.random().toString(36).slice(2, 10)}`,
      requisitionId,
      action,
      message,
      actorId: actor.id,
      actorName: actor.name,
      createdAt: new Date().toISOString(),
    };
    this.audit = [entry, ...this.audit];
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const requisitionsAdapter: RequisitionsAdapter = new MockRequisitionsAdapter();

import type { CreatePurchaseOrderInput, PurchaseOrder, PurchaseOrderLineItem, PurchaseOrderStatus, UpdatePurchaseOrderInput } from "@/types/domain/purchase-order";
import type { Approval, ApprovalDecision } from "@/types/domain/approval";
import type { PurchaseOrderAuditEntry } from "@/types/domain/purchase-order-audit";
import { mockPurchaseOrders } from "@/data/mock/purchase-orders";
import { mockPurchaseOrderLineItems } from "@/data/mock/purchase-order-line-items";
import { mockApprovals } from "@/data/mock/approvals";
import { mockPurchaseOrderAudit } from "@/data/mock/purchase-order-audit";
import { rfqAdapter } from "@/lib/api/adapters/rfq-adapter";

/**
 * Adapter boundary for Purchase Orders (Part 10). Components/hooks depend
 * on this interface, never on the concrete implementation below —
 * swapping to a real backend means adding
 * `purchase-orders-adapter.rest.ts` implementing the same interface and
 * changing the single export at the bottom of this file.
 *
 * **Cross-adapter dependency, by design** — same pattern as
 * `RFQAdapter.create` (Part 9): `create` below calls `rfqAdapter`'s own
 * public methods (never its mock arrays directly) to validate the RFQ is
 * finalized, pull the vendor's selected lines, and snapshot each line's
 * quoted rate. A real backend would do the equivalent join across the RFQ,
 * RFQLine and RFQVendorQuote tables at PO-creation time.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 10) for full detail:
 *   GET    /api/purchase-orders                    — list, filtered by project/vendor/rfq/status
 *   GET    /api/purchase-orders/:id                 — detail
 *   GET    /api/purchase-orders/:id/line-items       — this PO's line items
 *   GET    /api/purchase-orders/:id/approvals        — this PO's level-decisions
 *   GET    /api/purchase-orders/:id/audit            — history
 *   POST   /api/purchase-orders                     — create from a finalized RFQ's vendor group (po:create)
 *   PATCH  /api/purchase-orders/:id                  — edit terms/tax (po:create, only while draft/rejected)
 *   POST   /api/purchase-orders/:id/submit           — submit for level 1 approval (po:create)
 *   POST   /api/purchase-orders/:id/decide-level1     — approve or reject at level 1 (po:approve:level1)
 *   POST   /api/purchase-orders/:id/decide-level2     — approve or reject at level 2 (po:approve:level2)
 *   POST   /api/purchase-orders/:id/release           — release an approved PO (po:issue)
 *   POST   /api/purchase-orders/:id/issue             — issue a released PO, dispatch email (po:issue)
 */
export interface PurchaseOrderActor {
  id: string;
  name: string;
}

export interface PurchaseOrderListParams {
  search?: string;
  status?: PurchaseOrderStatus;
  projectId?: string;
  vendorId?: string;
  /** Backs the RFQ detail page's "does this vendor group already have a PO?" check. */
  rfqId?: string;
  sortBy?: "createdAt" | "updatedAt" | "status" | "poNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PurchaseOrderListResult {
  items: PurchaseOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PurchaseOrdersAdapter {
  list(params?: PurchaseOrderListParams): Promise<PurchaseOrderListResult>;
  get(id: string): Promise<PurchaseOrder | null>;
  listLineItems(purchaseOrderId: string): Promise<PurchaseOrderLineItem[]>;
  listApprovals(purchaseOrderId: string): Promise<Approval[]>;
  listAuditHistory(purchaseOrderId: string): Promise<PurchaseOrderAuditEntry[]>;
  create(input: CreatePurchaseOrderInput, actor: PurchaseOrderActor): Promise<PurchaseOrder>;
  update(id: string, patch: UpdatePurchaseOrderInput, actor: PurchaseOrderActor): Promise<PurchaseOrder>;
  submit(id: string, actor: PurchaseOrderActor): Promise<PurchaseOrder>;
  decideLevel1(id: string, decision: ApprovalDecision, actor: PurchaseOrderActor, comment?: string): Promise<PurchaseOrder>;
  decideLevel2(id: string, decision: ApprovalDecision, actor: PurchaseOrderActor, comment?: string): Promise<PurchaseOrder>;
  release(id: string, actor: PurchaseOrderActor): Promise<PurchaseOrder>;
  issue(id: string, actor: PurchaseOrderActor): Promise<PurchaseOrder>;
}

class MockPurchaseOrdersAdapter implements PurchaseOrdersAdapter {
  private purchaseOrders: PurchaseOrder[] = [...mockPurchaseOrders];
  private lineItems: PurchaseOrderLineItem[] = [...mockPurchaseOrderLineItems];
  private approvals: Approval[] = [...mockApprovals];
  private audit: PurchaseOrderAuditEntry[] = [...mockPurchaseOrderAudit];

  async list(params: PurchaseOrderListParams = {}): Promise<PurchaseOrderListResult> {
    await delay(300);
    let items = [...this.purchaseOrders];

    if (params.projectId) items = items.filter((p) => p.projectId === params.projectId);
    if (params.vendorId) items = items.filter((p) => p.vendorId === params.vendorId);
    if (params.rfqId) items = items.filter((p) => p.rfqId === params.rfqId);
    if (params.status) items = items.filter((p) => p.status === params.status);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((p) => p.poNumber.toLowerCase().includes(q));
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

  async get(id: string): Promise<PurchaseOrder | null> {
    await delay(200);
    return this.purchaseOrders.find((p) => p.id === id) ?? null;
  }

  async listLineItems(purchaseOrderId: string): Promise<PurchaseOrderLineItem[]> {
    await delay(200);
    return this.lineItems.filter((l) => l.purchaseOrderId === purchaseOrderId);
  }

  async listApprovals(purchaseOrderId: string): Promise<Approval[]> {
    await delay(200);
    return this.approvals.filter((a) => a.purchaseOrderId === purchaseOrderId).sort((a, b) => (a.decidedAt < b.decidedAt ? -1 : 1));
  }

  async listAuditHistory(purchaseOrderId: string): Promise<PurchaseOrderAuditEntry[]> {
    await delay(250);
    return this.audit.filter((a) => a.purchaseOrderId === purchaseOrderId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async create(input: CreatePurchaseOrderInput, actor: PurchaseOrderActor): Promise<PurchaseOrder> {
    await delay(500);
    const rfq = await rfqAdapter.get(input.rfqId);
    if (!rfq) throw new Error("RFQ not found.");
    if (rfq.status !== "finalized") {
      throw new Error("A Purchase Order can only be created from a finalized RFQ.");
    }

    const rfqLines = await rfqAdapter.listLines(input.rfqId);
    const vendorLines = rfqLines.filter((l) => l.selectedVendorId === input.vendorId);
    if (vendorLines.length === 0) {
      throw new Error("This vendor has no selected lines on this RFQ.");
    }

    const existingPOIdsForRFQ = new Set(this.purchaseOrders.filter((p) => p.rfqId === input.rfqId).map((p) => p.id));
    const claimedLineIds = new Set(this.lineItems.filter((li) => existingPOIdsForRFQ.has(li.purchaseOrderId)).map((li) => li.rfqLineId));
    if (vendorLines.some((l) => claimedLineIds.has(l.id))) {
      throw new Error("One or more of this vendor's lines on this RFQ already belong to another Purchase Order.");
    }

    const quotes = await rfqAdapter.listVendorQuotes(input.rfqId);
    const now = new Date().toISOString();
    const purchaseOrder: PurchaseOrder = {
      id: `po_${Math.random().toString(36).slice(2, 10)}`,
      poNumber: `BB-PO-${new Date().getFullYear()}-${String(this.purchaseOrders.length + 1).padStart(3, "0")}`,
      rfqId: input.rfqId,
      requisitionId: rfq.requisitionId,
      projectId: rfq.projectId,
      vendorId: input.vendorId,
      status: "draft",
      rejectedAtLevel: null,
      termsAndConditions: input.termsAndConditions ?? "",
      taxPercent: rfq.taxPercent,
      preparedBy: actor.id,
      preparedByName: actor.name,
      submittedAt: null,
      releasedAt: null,
      issuedAt: null,
      emailDispatchStatus: "not_sent",
      emailDispatchedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.purchaseOrders = [purchaseOrder, ...this.purchaseOrders];

    const newLineItems: PurchaseOrderLineItem[] = vendorLines.map((line) => {
      const quote = quotes.find((q) => q.rfqLineId === line.id && q.vendorId === input.vendorId);
      return {
        id: `pli_${Math.random().toString(36).slice(2, 10)}`,
        purchaseOrderId: purchaseOrder.id,
        rfqLineId: line.id,
        description: line.description,
        uom: line.uom,
        quantity: line.quantity,
        rate: quote?.rate ?? 0,
      };
    });
    this.lineItems = [...this.lineItems, ...newLineItems];

    this.pushAudit(purchaseOrder.id, "created", "Purchase Order created from finalized RFQ.", actor);
    return purchaseOrder;
  }

  async update(id: string, patch: UpdatePurchaseOrderInput, actor: PurchaseOrderActor): Promise<PurchaseOrder> {
    await delay(400);
    const purchaseOrder = this.mustFind(id);
    if (purchaseOrder.status !== "draft" && purchaseOrder.status !== "rejected") {
      throw new Error("This Purchase Order can no longer be edited — only a draft or rejected PO can be updated.");
    }
    // Revising a rejected PO resets it to "draft" — same FRONTEND
    // IMPLEMENTATION DECISION as Contract/Requisition's decline-then-revise
    // handling. See docs/OPEN_QUESTIONS.md #31.
    const wasRejected = purchaseOrder.status === "rejected";
    const updated: PurchaseOrder = {
      ...purchaseOrder,
      ...(patch.termsAndConditions !== undefined ? { termsAndConditions: patch.termsAndConditions } : {}),
      ...(patch.taxPercent !== undefined ? { taxPercent: patch.taxPercent } : {}),
      ...(wasRejected ? { status: "draft" as const, rejectedAtLevel: null } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    this.pushAudit(id, "updated", wasRejected ? "Revised after rejection — reset to draft, ready to submit again." : "Terms/tax updated.", actor);
    return updated;
  }

  async submit(id: string, actor: PurchaseOrderActor): Promise<PurchaseOrder> {
    await delay(400);
    const purchaseOrder = this.mustFind(id);
    if (purchaseOrder.status !== "draft") {
      throw new Error("Only a draft Purchase Order can be submitted for approval.");
    }
    const updated: PurchaseOrder = { ...purchaseOrder, status: "pending_approval_l1", submittedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.replace(updated);
    this.pushAudit(id, "submitted", "Submitted for level 1 approval.", actor);
    return updated;
  }

  async decideLevel1(id: string, decision: ApprovalDecision, actor: PurchaseOrderActor, comment?: string): Promise<PurchaseOrder> {
    await delay(450);
    const purchaseOrder = this.mustFind(id);
    if (purchaseOrder.status !== "pending_approval_l1") {
      throw new Error("This Purchase Order is not currently awaiting level 1 approval.");
    }
    this.pushApproval(id, 1, decision, actor, comment);
    const updated: PurchaseOrder =
      decision === "approved"
        ? { ...purchaseOrder, status: "pending_approval_l2", updatedAt: new Date().toISOString() }
        : { ...purchaseOrder, status: "rejected", rejectedAtLevel: 1, updatedAt: new Date().toISOString() };
    this.replace(updated);
    this.pushAudit(
      id,
      decision === "approved" ? "approved_level1" : "rejected",
      decision === "approved" ? `Approved at level 1 by ${actor.name}.` : `Rejected at level 1 by ${actor.name}${comment ? `: ${comment}` : "."}`,
      actor,
    );
    return updated;
  }

  async decideLevel2(id: string, decision: ApprovalDecision, actor: PurchaseOrderActor, comment?: string): Promise<PurchaseOrder> {
    await delay(450);
    const purchaseOrder = this.mustFind(id);
    if (purchaseOrder.status !== "pending_approval_l2") {
      throw new Error("This Purchase Order is not currently awaiting level 2 approval.");
    }
    this.pushApproval(id, 2, decision, actor, comment);
    const updated: PurchaseOrder =
      decision === "approved"
        ? { ...purchaseOrder, status: "approved", updatedAt: new Date().toISOString() }
        : { ...purchaseOrder, status: "rejected", rejectedAtLevel: 2, updatedAt: new Date().toISOString() };
    this.replace(updated);
    this.pushAudit(
      id,
      decision === "approved" ? "approved_level2" : "rejected",
      decision === "approved" ? `Approved at level 2 by ${actor.name}.` : `Rejected at level 2 by ${actor.name}${comment ? `: ${comment}` : "."}`,
      actor,
    );
    return updated;
  }

  async release(id: string, actor: PurchaseOrderActor): Promise<PurchaseOrder> {
    await delay(400);
    const purchaseOrder = this.mustFind(id);
    if (purchaseOrder.status !== "approved") {
      throw new Error("Only a fully-approved Purchase Order can be released.");
    }
    const updated: PurchaseOrder = { ...purchaseOrder, status: "released", releasedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.replace(updated);
    this.pushAudit(id, "released", "Released.", actor);
    return updated;
  }

  async issue(id: string, actor: PurchaseOrderActor): Promise<PurchaseOrder> {
    await delay(450);
    const purchaseOrder = this.mustFind(id);
    if (purchaseOrder.status !== "released") {
      throw new Error("Only a released Purchase Order can be issued.");
    }
    const now = new Date().toISOString();
    // Email dispatch is mocked as immediately "sent" — a real email
    // service would update this field asynchronously. FRONTEND
    // IMPLEMENTATION DECISION, see docs/OPEN_QUESTIONS.md #31.
    const updated: PurchaseOrder = { ...purchaseOrder, status: "issued", issuedAt: now, emailDispatchStatus: "sent", emailDispatchedAt: now, updatedAt: now };
    this.replace(updated);
    this.pushAudit(id, "issued", "Issued to vendor — email dispatched.", actor);
    return updated;
  }

  private mustFind(id: string): PurchaseOrder {
    const purchaseOrder = this.purchaseOrders.find((p) => p.id === id);
    if (!purchaseOrder) throw new Error("Purchase Order not found.");
    return purchaseOrder;
  }

  private replace(updated: PurchaseOrder) {
    this.purchaseOrders = this.purchaseOrders.map((p) => (p.id === updated.id ? updated : p));
  }

  private pushApproval(purchaseOrderId: string, level: 1 | 2, decision: ApprovalDecision, actor: PurchaseOrderActor, comment?: string) {
    const entry: Approval = {
      id: `appr_${Math.random().toString(36).slice(2, 10)}`,
      purchaseOrderId,
      level,
      decision,
      decidedBy: actor.id,
      decidedByName: actor.name,
      comment,
      decidedAt: new Date().toISOString(),
    };
    this.approvals = [entry, ...this.approvals];
  }

  private pushAudit(purchaseOrderId: string, action: PurchaseOrderAuditEntry["action"], message: string, actor: PurchaseOrderActor) {
    const entry: PurchaseOrderAuditEntry = {
      id: `poaud_${Math.random().toString(36).slice(2, 10)}`,
      purchaseOrderId,
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

export const purchaseOrdersAdapter: PurchaseOrdersAdapter = new MockPurchaseOrdersAdapter();

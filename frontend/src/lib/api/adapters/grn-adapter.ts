import type { CreateGRNInput, GRN, GRNLineItem, UpdateGRNInput } from "@/types/domain/grn";
import { mockGRNs, mockGRNLineItems } from "@/data/mock/grn";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";

/**
 * Adapter boundary for Goods Receipt Notes (Part 11). Components/hooks
 * depend on this interface, never on the concrete implementation below —
 * swapping to a real backend means adding `grn-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * **Cross-adapter dependency, by design** — same pattern as
 * `RFQAdapter.create`/`PurchaseOrdersAdapter.create`: `create` below calls
 * `purchaseOrdersAdapter`'s own methods (never its mock arrays directly)
 * to confirm the source PO is `issued` and to snapshot each claimed
 * line's ordered quantity/description/UOM/rate. A real backend would do
 * the equivalent join against the Purchase Order and its line items at
 * GRN-creation time.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 11) for full detail:
 *   GET    /api/grn                    — list, filtered by project/vendor/purchaseOrder
 *   GET    /api/grn/:id                 — detail
 *   GET    /api/grn/:id/line-items       — this GRN's line items
 *   POST   /api/grn                     — create against an issued PO (grn:create)
 *   PATCH  /api/grn/:id                  — edit received quantities/brand/warranty/notes (grn:create)
 */
export interface GRNActor {
  id: string;
  name: string;
}

export interface GRNListParams {
  search?: string;
  projectId?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  sortBy?: "createdAt" | "updatedAt" | "receivedAt" | "grnNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface GRNListResult {
  items: GRN[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GRNAdapter {
  list(params?: GRNListParams): Promise<GRNListResult>;
  get(id: string): Promise<GRN | null>;
  listLineItems(grnId: string): Promise<GRNLineItem[]>;
  /** Single line lookup across every GRN, by its own id — added for Part 12's MRC module (`source: "grn"` lines certify a specific `GRNLineItem`, not a whole GRN). */
  getLineItem(id: string): Promise<GRNLineItem | null>;
  /** Every line item across every GRN, flattened — backs the MRC create form's "certify a received line" picker (Part 12). Pair with `list()` to resolve each line's `grnNumber`/`projectId`. */
  listAllLineItems(): Promise<GRNLineItem[]>;
  create(input: CreateGRNInput, actor: GRNActor): Promise<GRN>;
  update(id: string, patch: UpdateGRNInput, actor: GRNActor): Promise<GRN>;
}

class MockGRNAdapter implements GRNAdapter {
  private grns: GRN[] = [...mockGRNs];
  private lineItems: GRNLineItem[] = [...mockGRNLineItems];

  async list(params: GRNListParams = {}): Promise<GRNListResult> {
    await delay(300);
    let items = [...this.grns];

    if (params.projectId) items = items.filter((g) => g.projectId === params.projectId);
    if (params.vendorId) items = items.filter((g) => g.vendorId === params.vendorId);
    if (params.purchaseOrderId) items = items.filter((g) => g.purchaseOrderId === params.purchaseOrderId);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((g) => g.grnNumber.toLowerCase().includes(q));
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

  async get(id: string): Promise<GRN | null> {
    await delay(200);
    return this.grns.find((g) => g.id === id) ?? null;
  }

  async listLineItems(grnId: string): Promise<GRNLineItem[]> {
    await delay(200);
    return this.lineItems.filter((l) => l.grnId === grnId);
  }

  async getLineItem(id: string): Promise<GRNLineItem | null> {
    await delay(150);
    return this.lineItems.find((l) => l.id === id) ?? null;
  }

  async listAllLineItems(): Promise<GRNLineItem[]> {
    await delay(200);
    return [...this.lineItems];
  }

  async create(input: CreateGRNInput, actor: GRNActor): Promise<GRN> {
    await delay(500);
    const purchaseOrder = await purchaseOrdersAdapter.get(input.purchaseOrderId);
    if (!purchaseOrder) throw new Error("Purchase Order not found.");
    if (purchaseOrder.status !== "issued") {
      throw new Error("A GRN can only be recorded against an issued Purchase Order.");
    }
    if (input.lines.length === 0) throw new Error("Record at least one received line.");

    const poLineItems = await purchaseOrdersAdapter.listLineItems(input.purchaseOrderId);
    const now = new Date().toISOString();
    const grn: GRN = {
      id: `grn_${Math.random().toString(36).slice(2, 10)}`,
      grnNumber: `BB-GRN-${new Date().getFullYear()}-${String(this.grns.length + 1).padStart(3, "0")}`,
      purchaseOrderId: input.purchaseOrderId,
      projectId: purchaseOrder.projectId,
      vendorId: purchaseOrder.vendorId,
      receivedBy: actor.id,
      receivedByName: actor.name,
      receivedAt: input.receivedAt,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    const newLineItems: GRNLineItem[] = input.lines.map((line) => {
      const poLine = poLineItems.find((l) => l.id === line.purchaseOrderLineItemId);
      if (!poLine) throw new Error("One of the selected lines no longer belongs to this Purchase Order.");
      this.assertWithinOrdered(poLine.id, poLine.description, poLine.quantity, line.receivedQuantity);
      return {
        id: `grnli_${Math.random().toString(36).slice(2, 10)}`,
        grnId: grn.id,
        purchaseOrderLineItemId: poLine.id,
        description: poLine.description,
        uom: poLine.uom,
        orderedQuantity: poLine.quantity,
        receivedQuantity: line.receivedQuantity,
        rate: poLine.rate,
        brand: line.brand,
        warrantyCertificateNumber: line.warrantyCertificateNumber,
        stockMaterial: line.stockMaterial,
      };
    });
    // BUG FIX (owner report: the "would bring the total received to..."
    // over-receipt guard kept firing on what the owner believed was a
    // fresh GRN attempt). `this.grns` used to be committed *before* this
    // `.map()` ran its `assertWithinOrdered` check on each line — so a
    // validation failure on any line (the common case being exactly this
    // guard tripping) still left a real, line-item-less "ghost" GRN behind
    // in `this.grns`: a consumed `grnNumber`, and — since the PO detail
    // page's "Goods Receipt Notes" list is driven purely by
    // `GRNsAdapter.list({ purchaseOrderId })`, with no check on whether a
    // GRN actually has any lines — a misleading entry claiming something
    // had been received when nothing actually had. A second attempt from
    // that same, now-"already has a GRN" PO is exactly what made the
    // guard's math look wrong: it wasn't double-counting, there was a
    // real (if empty) GRN record sitting there from the first, failed
    // click. `create()` is now properly all-or-nothing — the GRN header is
    // only committed alongside its line items, once every line has passed
    // validation, so a thrown error leaves no trace at all.
    this.grns = [grn, ...this.grns];
    this.lineItems = [...this.lineItems, ...newLineItems];

    return grn;
  }

  async update(id: string, patch: UpdateGRNInput, _actor: GRNActor): Promise<GRN> {
    await delay(400);
    const grn = this.mustFind(id);
    const updated: GRN = {
      ...grn,
      ...(patch.receivedAt !== undefined ? { receivedAt: patch.receivedAt } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.grns = this.grns.map((g) => (g.id === id ? updated : g));

    if (patch.lines) {
      const existingLines = this.lineItems.filter((l) => l.grnId === id);
      const remaining = this.lineItems.filter((l) => l.grnId !== id);
      const revisedLines: GRNLineItem[] = patch.lines.map((line) => {
        const existing = existingLines.find((l) => l.purchaseOrderLineItemId === line.purchaseOrderLineItemId);
        if (!existing) throw new Error("Can't add a new line to an existing GRN — record a separate GRN instead.");
        // Exclude this GRN's own prior value for the line (`id` below) so editing
        // the same GRN's received quantity isn't double-counted against itself.
        this.assertWithinOrdered(existing.purchaseOrderLineItemId, existing.description, existing.orderedQuantity, line.receivedQuantity, existing.id);
        return {
          ...existing,
          receivedQuantity: line.receivedQuantity,
          brand: line.brand,
          warrantyCertificateNumber: line.warrantyCertificateNumber,
          stockMaterial: line.stockMaterial,
        };
      });
      this.lineItems = [...remaining, ...revisedLines];
    }

    return updated;
  }

  private mustFind(id: string): GRN {
    const grn = this.grns.find((g) => g.id === id);
    if (!grn) throw new Error("GRN not found.");
    return grn;
  }

  /**
   * Over-receipt guard (`docs/OPEN_QUESTIONS.md` #32b, closed by the
   * BrickBasket business-requirements audit pass — see `docs/CHANGELOG.md`).
   * GRN deliberately allows more than one GRN against the same PO line
   * (split deliveries), but nothing previously checked that the received
   * quantities, summed across every GRN against that line, stayed within
   * what was actually ordered. This throws before any line is written if
   * the new/revised `receivedQuantity`, added to every *other* GRN line
   * already recorded against the same `purchaseOrderLineItemId`, would
   * exceed the PO line's own `orderedQuantity`. `excludeLineId` lets
   * `update()` re-check an edited line's own prior value without double
   * counting it against itself.
   */
  private assertWithinOrdered(purchaseOrderLineItemId: string, description: string, orderedQuantity: number, newReceivedQuantity: number, excludeLineId?: string): void {
    const alreadyReceived = this.lineItems
      .filter((l) => l.purchaseOrderLineItemId === purchaseOrderLineItemId && l.id !== excludeLineId)
      .reduce((sum, l) => sum + l.receivedQuantity, 0);
    const total = alreadyReceived + newReceivedQuantity;
    if (total > orderedQuantity) {
      const alreadyText = alreadyReceived > 0 ? ` (${alreadyReceived} already received across other GRNs)` : "";
      throw new Error(`"${description}": receiving ${newReceivedQuantity} would bring the total received to ${total}, more than the ${orderedQuantity} ordered${alreadyText}.`);
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const grnAdapter: GRNAdapter = new MockGRNAdapter();

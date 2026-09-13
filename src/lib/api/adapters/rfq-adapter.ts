import type { CreateRFQInput, RFQ, RFQLine, RFQStatus, RFQVendorQuote, UpdateRFQInput } from "@/types/domain/rfq";
import { mockRFQs } from "@/data/mock/rfqs";
import { mockRFQLines } from "@/data/mock/rfq-lines";
import { mockRFQVendorQuotes } from "@/data/mock/rfq-vendor-quotes";
import { requisitionsAdapter } from "@/lib/api/adapters/requisitions-adapter";
import { aceAdapter } from "@/lib/api/adapters/ace-adapter";

/**
 * Adapter boundary for RFQ Management. Components/hooks depend on this
 * interface, never on the concrete implementation below — swapping to a
 * real backend means adding `rfq-adapter.rest.ts` implementing the same
 * interface and changing the single export at the bottom of this file.
 *
 * **Cross-adapter dependency, by design:** `create` below calls
 * `requisitionsAdapter`/`aceAdapter`'s own public methods (never their
 * mock arrays directly — mock-data isolation stays intact) to pull an
 * approved requisition's lines and snapshot each line's ACE rate. A real
 * backend would do the equivalent join across the Requisition,
 * MaterialRequirement and ACEItem tables at RFQ-creation time; this
 * mirrors that at the frontend's adapter layer instead of reaching into
 * another module's mock data.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 9) for full detail:
 *   GET    /api/rfqs                              — list, filtered by project/status
 *   GET    /api/rfqs/:id                          — detail
 *   GET    /api/rfqs/:id/lines                     — this RFQ's comparison rows
 *   GET    /api/rfqs/:id/vendor-quotes              — every quote across this RFQ's lines
 *   POST   /api/rfqs                               — create from an approved requisition (rfq:compare)
 *   PATCH  /api/rfqs/:id                            — edit tax rate (rfq:compare, only while draft)
 *   PUT    /api/rfqs/:id/lines/:lineId/quotes/:vendorId   — add/update a vendor's quote (rfq:compare)
 *   DELETE /api/rfqs/:id/lines/:lineId/quotes/:vendorId   — remove a vendor's quote (rfq:compare)
 *   POST   /api/rfqs/:id/lines/:lineId/select-vendor      — select (or clear) this line's vendor (rfq:compare)
 *   POST   /api/rfqs/:id/finalize                   — lock the comparison in, readiness state (rfq:compare)
 */
export interface RFQActor {
  id: string;
  name: string;
}

export interface RFQListParams {
  search?: string;
  projectId?: string;
  status?: RFQStatus;
  /** Backs the "already has an RFQ?" check used by the Requisition detail page and the New RFQ form. */
  requisitionId?: string;
  sortBy?: "createdAt" | "updatedAt" | "status" | "rfqNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface RFQListResult {
  items: RFQ[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RFQAdapter {
  list(params?: RFQListParams): Promise<RFQListResult>;
  get(id: string): Promise<RFQ | null>;
  listLines(rfqId: string): Promise<RFQLine[]>;
  listVendorQuotes(rfqId: string): Promise<RFQVendorQuote[]>;
  create(input: CreateRFQInput, actor: RFQActor): Promise<RFQ>;
  update(id: string, patch: UpdateRFQInput, actor: RFQActor): Promise<RFQ>;
  setVendorQuote(rfqId: string, lineId: string, vendorId: string, rate: number, actor: RFQActor): Promise<RFQVendorQuote>;
  removeVendorQuote(rfqId: string, lineId: string, vendorId: string, actor: RFQActor): Promise<void>;
  selectVendor(rfqId: string, lineId: string, vendorId: string | null, actor: RFQActor): Promise<RFQLine>;
  finalize(rfqId: string, actor: RFQActor): Promise<RFQ>;
}

const MAX_VENDOR_QUOTES_PER_LINE = 3;

class MockRFQAdapter implements RFQAdapter {
  private rfqs: RFQ[] = [...mockRFQs];
  private lines: RFQLine[] = [...mockRFQLines];
  private quotes: RFQVendorQuote[] = [...mockRFQVendorQuotes];

  async list(params: RFQListParams = {}): Promise<RFQListResult> {
    await delay(300);
    let items = [...this.rfqs];

    if (params.projectId) items = items.filter((r) => r.projectId === params.projectId);
    if (params.status) items = items.filter((r) => r.status === params.status);
    if (params.requisitionId) items = items.filter((r) => r.requisitionId === params.requisitionId);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((r) => r.rfqNumber.toLowerCase().includes(q));
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

  async get(id: string): Promise<RFQ | null> {
    await delay(200);
    return this.rfqs.find((r) => r.id === id) ?? null;
  }

  async listLines(rfqId: string): Promise<RFQLine[]> {
    await delay(200);
    return this.lines.filter((l) => l.rfqId === rfqId);
  }

  async listVendorQuotes(rfqId: string): Promise<RFQVendorQuote[]> {
    await delay(200);
    const lineIds = new Set(this.lines.filter((l) => l.rfqId === rfqId).map((l) => l.id));
    return this.quotes.filter((q) => lineIds.has(q.rfqLineId));
  }

  async create(input: CreateRFQInput, actor: RFQActor): Promise<RFQ> {
    await delay(500);
    const requisition = await requisitionsAdapter.get(input.requisitionId);
    if (!requisition) throw new Error("Requisition not found.");
    if (requisition.status !== "approved") {
      throw new Error("Only an approved requisition can be sent to RFQ.");
    }
    if (this.rfqs.some((r) => r.requisitionId === input.requisitionId)) {
      throw new Error("This requisition already has an RFQ.");
    }

    const now = new Date().toISOString();
    const rfq: RFQ = {
      id: `rfq_${Math.random().toString(36).slice(2, 10)}`,
      rfqNumber: `BB-RFQ-${new Date().getFullYear()}-${String(this.rfqs.length + 1).padStart(3, "0")}`,
      requisitionId: input.requisitionId,
      projectId: requisition.projectId,
      status: "draft",
      taxPercent: input.taxPercent ?? 18,
      preparedBy: actor.id,
      preparedByName: actor.name,
      finalizedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.rfqs = [rfq, ...this.rfqs];

    const materialLines = await requisitionsAdapter.listLines(input.requisitionId);
    const newLines: RFQLine[] = await Promise.all(
      materialLines.map(async (ml) => {
        let aceRate: number | null = null;
        if (ml.source === "predefined" && ml.aceItemId) {
          const aceItem = await aceAdapter.get(ml.aceItemId);
          aceRate = aceItem?.rate ?? null;
        }
        return {
          id: `rfql_${Math.random().toString(36).slice(2, 10)}`,
          rfqId: rfq.id,
          materialRequirementId: ml.id,
          description: ml.description,
          uom: ml.uom,
          quantity: ml.quantity,
          aceItemId: ml.aceItemId,
          aceRate,
          selectedVendorId: null,
        };
      }),
    );
    this.lines = [...this.lines, ...newLines];

    return rfq;
  }

  async update(id: string, patch: UpdateRFQInput, _actor: RFQActor): Promise<RFQ> {
    await delay(300);
    const rfq = this.mustFind(id);
    if (rfq.status !== "draft") {
      throw new Error("Only a draft RFQ (still in comparison) can be edited.");
    }
    const updated: RFQ = {
      ...rfq,
      ...(patch.taxPercent !== undefined ? { taxPercent: patch.taxPercent } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    return updated;
  }

  async setVendorQuote(rfqId: string, lineId: string, vendorId: string, rate: number, _actor: RFQActor): Promise<RFQVendorQuote> {
    await delay(350);
    const rfq = this.mustFind(rfqId);
    if (rfq.status !== "draft") {
      throw new Error("Vendor quotes can only be entered while the RFQ is still in comparison.");
    }
    const line = this.mustFindLine(rfqId, lineId);
    const lineQuotes = this.quotes.filter((q) => q.rfqLineId === line.id);
    const existing = lineQuotes.find((q) => q.vendorId === vendorId);
    const distinctVendorCount = new Set(lineQuotes.map((q) => q.vendorId)).size;
    if (!existing && distinctVendorCount >= MAX_VENDOR_QUOTES_PER_LINE) {
      throw new Error(`A maximum of ${MAX_VENDOR_QUOTES_PER_LINE} vendor quotes per line is supported — remove one before adding another.`);
    }

    const now = new Date().toISOString();
    if (existing) {
      const updated: RFQVendorQuote = { ...existing, rate, quotedAt: now };
      this.quotes = this.quotes.map((q) => (q.id === existing.id ? updated : q));
      return updated;
    }
    const created: RFQVendorQuote = {
      id: `rfqvq_${Math.random().toString(36).slice(2, 10)}`,
      rfqLineId: line.id,
      vendorId,
      rate,
      quotedAt: now,
    };
    this.quotes = [...this.quotes, created];
    return created;
  }

  async removeVendorQuote(rfqId: string, lineId: string, vendorId: string, _actor: RFQActor): Promise<void> {
    await delay(300);
    const rfq = this.mustFind(rfqId);
    if (rfq.status !== "draft") {
      throw new Error("Vendor quotes can only be changed while the RFQ is still in comparison.");
    }
    const line = this.mustFindLine(rfqId, lineId);
    this.quotes = this.quotes.filter((q) => !(q.rfqLineId === line.id && q.vendorId === vendorId));
    if (line.selectedVendorId === vendorId) {
      this.lines = this.lines.map((l) => (l.id === line.id ? { ...l, selectedVendorId: null } : l));
    }
  }

  async selectVendor(rfqId: string, lineId: string, vendorId: string | null, _actor: RFQActor): Promise<RFQLine> {
    await delay(300);
    const rfq = this.mustFind(rfqId);
    if (rfq.status !== "draft") {
      throw new Error("Vendor selection can only change while the RFQ is still in comparison.");
    }
    const line = this.mustFindLine(rfqId, lineId);
    if (vendorId !== null && !this.quotes.some((q) => q.rfqLineId === line.id && q.vendorId === vendorId)) {
      throw new Error("Select a vendor that has quoted this line.");
    }
    const updated: RFQLine = { ...line, selectedVendorId: vendorId };
    this.lines = this.lines.map((l) => (l.id === line.id ? updated : l));
    return updated;
  }

  async finalize(rfqId: string, _actor: RFQActor): Promise<RFQ> {
    await delay(450);
    const rfq = this.mustFind(rfqId);
    if (rfq.status !== "draft") {
      throw new Error("This RFQ has already been finalized.");
    }
    const lines = this.lines.filter((l) => l.rfqId === rfqId);
    if (lines.length === 0) {
      throw new Error("This RFQ has no comparison lines to finalize.");
    }
    if (lines.some((l) => !l.selectedVendorId)) {
      throw new Error("Select a vendor for every line before finalizing.");
    }
    const updated: RFQ = { ...rfq, status: "finalized", finalizedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.replace(updated);
    return updated;
  }

  private mustFind(id: string): RFQ {
    const rfq = this.rfqs.find((r) => r.id === id);
    if (!rfq) throw new Error("RFQ not found.");
    return rfq;
  }

  private mustFindLine(rfqId: string, lineId: string): RFQLine {
    const line = this.lines.find((l) => l.id === lineId && l.rfqId === rfqId);
    if (!line) throw new Error("RFQ line not found.");
    return line;
  }

  private replace(updated: RFQ) {
    this.rfqs = this.rfqs.map((r) => (r.id === updated.id ? updated : r));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const rfqAdapter: RFQAdapter = new MockRFQAdapter();

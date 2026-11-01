import type { CreateStockEntryInput, MaterialReceiptSummary, StockEntry, StockMaterial, StockTrace, UpdateStockEntryInput } from "@/types/domain/stock-entry";
import { mockStockEntries } from "@/data/mock/stock-entries";
import { grnAdapter } from "@/lib/api/adapters/grn-adapter";
import { storeRequisitionsAdapter } from "@/lib/api/adapters/store-requisitions-adapter";
import { wastageAdapter } from "@/lib/api/adapters/wastage-adapter";

/**
 * Adapter boundary for the Stock Statement module (Part 11).
 * Components/hooks depend on this interface, never on the concrete
 * implementation below — swapping to a real backend means adding
 * `stock-adapter.rest.ts` implementing the same interface and changing
 * the single export at the bottom of this file.
 *
 * **Cross-adapter dependency, by design (spec-review correction,
 * docs/OPEN_QUESTIONS.md #32)** — `getTrace` below calls `grnAdapter`,
 * `storeRequisitionsAdapter`, and `wastageAdapter`'s own public methods
 * (never their mock arrays directly), the same composition discipline
 * `CostToCompleteAdapter.getSummary` already established, to answer "what
 * did GRN/MR/Wastage record for this same material and day" — see
 * `StockTrace`'s own header comment for why this is a read-only
 * reconciliation view, never a write into `StockEntry`.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 11) for full detail:
 *   GET    /api/stock-entries          — list, filtered by project/material/date range
 *   GET    /api/stock-entries/:id       — detail
 *   POST   /api/stock-entries          — create (stock:write)
 *   PATCH  /api/stock-entries/:id       — edit (stock:write, project/material immutable)
 *   GET    /api/stock-entries/trace     — the GRN/MR/Wastage reconciliation view for one project/material/date (see `getTrace`)
 */
export interface StockActor {
  id: string;
  name: string;
}

export interface StockListParams {
  search?: string;
  projectId?: string;
  material?: StockMaterial;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "createdAt" | "material";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StockListResult {
  items: StockEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StockAdapter {
  list(params?: StockListParams): Promise<StockListResult>;
  get(id: string): Promise<StockEntry | null>;
  create(input: CreateStockEntryInput, actor: StockActor): Promise<StockEntry>;
  update(id: string, patch: UpdateStockEntryInput, actor: StockActor): Promise<StockEntry>;
  /** See `StockTrace`'s own header comment — a read-only reconciliation view across GRN/Store Requisition/Wastage for this one (project, material, date) key, never a write into `StockEntry`. */
  getTrace(projectId: string, material: StockMaterial, date: string): Promise<StockTrace>;
  /** See `MaterialReceiptSummary`'s own header comment — a read-only, all-time (not date-scoped) GRN/MR/Wastage reconciliation for this one (project, material) key, backing `StoreRequisitionForm`'s "Received via GRN" panel. */
  getMaterialReceiptSummary(projectId: string, material: StockMaterial): Promise<MaterialReceiptSummary>;
}

class MockStockAdapter implements StockAdapter {
  private entries: StockEntry[] = [...mockStockEntries];

  async list(params: StockListParams = {}): Promise<StockListResult> {
    await delay(300);
    let items = [...this.entries];

    if (params.projectId) items = items.filter((e) => e.projectId === params.projectId);
    if (params.material) items = items.filter((e) => e.material === params.material);
    if (params.dateFrom) items = items.filter((e) => e.date >= params.dateFrom!);
    if (params.dateTo) items = items.filter((e) => e.date <= params.dateTo!);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((e) => (e.otherMaterialName ?? e.material).toLowerCase().includes(q) || (e.supplierName ?? "").toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "date";
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

  async get(id: string): Promise<StockEntry | null> {
    await delay(200);
    return this.entries.find((e) => e.id === id) ?? null;
  }

  async create(input: CreateStockEntryInput, _actor: StockActor): Promise<StockEntry> {
    await delay(400);
    const now = new Date().toISOString();
    const entry: StockEntry = {
      id: `stock_${Math.random().toString(36).slice(2, 10)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.entries = [entry, ...this.entries];
    return entry;
  }

  async update(id: string, patch: UpdateStockEntryInput, _actor: StockActor): Promise<StockEntry> {
    await delay(350);
    const entry = this.mustFind(id);
    const updated: StockEntry = { ...entry, ...patch, updatedAt: new Date().toISOString() };
    this.entries = this.entries.map((e) => (e.id === id ? updated : e));
    return updated;
  }

  async getTrace(projectId: string, material: StockMaterial, date: string): Promise<StockTrace> {
    await delay(300);
    const [grnResult, issuedResult, wastageResult] = await Promise.all([
      grnAdapter.list({ projectId, pageSize: 200 }),
      storeRequisitionsAdapter.list({ projectId, status: "issued", pageSize: 200 }),
      wastageAdapter.list({ projectId, material, pageSize: 200 }),
    ]);

    let tracedReceivedToday = 0;
    let tracedReceivedLineCount = 0;
    const grnsOnDate = grnResult.items.filter((g) => g.receivedAt.slice(0, 10) === date);
    for (const grn of grnsOnDate) {
      const lines = await grnAdapter.listLineItems(grn.id);
      for (const line of lines) {
        if (line.stockMaterial !== material) continue;
        tracedReceivedToday += line.receivedQuantity;
        tracedReceivedLineCount += 1;
      }
    }

    const tracedIssuedToday = issuedResult.items
      .filter((r) => r.material === material && r.issueDate === date)
      .reduce((sum, r) => sum + (r.approvedIssuedQuantity ?? 0), 0);

    const tracedWastedToday = wastageResult.items
      .filter((w) => w.recordedAt.slice(0, 10) === date)
      .reduce((sum, w) => sum + w.quantity, 0);

    return { projectId, material, date, tracedReceivedToday, tracedReceivedLineCount, tracedIssuedToday, tracedWastedToday };
  }

  async getMaterialReceiptSummary(projectId: string, material: StockMaterial): Promise<MaterialReceiptSummary> {
    await delay(300);
    const [grnResult, issuedResult, wastageResult] = await Promise.all([
      grnAdapter.list({ projectId, pageSize: 200 }),
      storeRequisitionsAdapter.list({ projectId, status: "issued", pageSize: 200 }),
      wastageAdapter.list({ projectId, material, pageSize: 200 }),
    ]);

    let totalReceived = 0;
    let receivedLineCount = 0;
    const grnNumbers = new Set<string>();
    for (const grn of grnResult.items) {
      const lines = await grnAdapter.listLineItems(grn.id);
      for (const line of lines) {
        if (line.stockMaterial !== material) continue;
        totalReceived += line.receivedQuantity;
        receivedLineCount += 1;
        grnNumbers.add(grn.grnNumber);
      }
    }

    const totalIssuedViaOtherRequisitions = issuedResult.items
      .filter((r) => r.material === material)
      .reduce((sum, r) => sum + (r.approvedIssuedQuantity ?? 0), 0);

    const totalWasted = wastageResult.items.reduce((sum, w) => sum + w.quantity, 0);

    return { projectId, material, totalReceived, receivedLineCount, grnNumbers: [...grnNumbers], totalIssuedViaOtherRequisitions, totalWasted };
  }

  private mustFind(id: string): StockEntry {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) throw new Error("Stock entry not found.");
    return entry;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const stockAdapter: StockAdapter = new MockStockAdapter();

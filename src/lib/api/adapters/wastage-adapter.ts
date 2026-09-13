import type { CreateWastageEntryInput, UpdateWastageEntryInput, WastageEntry } from "@/types/domain/wastage-entry";
import type { StockMaterial } from "@/types/domain/stock-entry";
import { mockWastageEntries } from "@/data/mock/wastage-entries";

/**
 * Adapter boundary for the Wastage module (Part 11). Components/hooks
 * depend on this interface, never on the concrete implementation below —
 * swapping to a real backend means adding `wastage-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * The required "summary" view is computed client-side from the full
 * `list()` result (`src/components/wastage/wastage-summary.tsx`), same
 * "computed, not stored" convention as every other derived total in this
 * app — a real backend serving a large dataset should expose a dedicated
 * aggregate endpoint rather than requiring the client to page through
 * every entry.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 11) for full detail:
 *   GET    /api/wastage-entries          — list, filtered by project/material
 *   GET    /api/wastage-entries/:id       — detail
 *   POST   /api/wastage-entries          — create (wastage:write)
 *   PATCH  /api/wastage-entries/:id       — edit (wastage:write)
 */
export interface WastageActor {
  id: string;
  name: string;
}

export interface WastageListParams {
  search?: string;
  projectId?: string;
  material?: StockMaterial;
  sortBy?: "recordedAt" | "createdAt" | "value" | "quantity";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface WastageListResult {
  items: WastageEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WastageAdapter {
  list(params?: WastageListParams): Promise<WastageListResult>;
  get(id: string): Promise<WastageEntry | null>;
  create(input: CreateWastageEntryInput, actor: WastageActor): Promise<WastageEntry>;
  update(id: string, patch: UpdateWastageEntryInput, actor: WastageActor): Promise<WastageEntry>;
}

class MockWastageAdapter implements WastageAdapter {
  private entries: WastageEntry[] = [...mockWastageEntries];

  async list(params: WastageListParams = {}): Promise<WastageListResult> {
    await delay(300);
    let items = [...this.entries];

    if (params.projectId) items = items.filter((e) => e.projectId === params.projectId);
    if (params.material) items = items.filter((e) => e.material === params.material);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((e) => (e.otherMaterialName ?? e.material).toLowerCase().includes(q) || (e.reason ?? "").toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "recordedAt";
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

  async get(id: string): Promise<WastageEntry | null> {
    await delay(200);
    return this.entries.find((e) => e.id === id) ?? null;
  }

  async create(input: CreateWastageEntryInput, actor: WastageActor): Promise<WastageEntry> {
    await delay(400);
    const now = new Date().toISOString();
    const entry: WastageEntry = {
      id: `waste_${Math.random().toString(36).slice(2, 10)}`,
      ...input,
      recordedBy: actor.id,
      recordedByName: actor.name,
      createdAt: now,
      updatedAt: now,
    };
    this.entries = [entry, ...this.entries];
    return entry;
  }

  async update(id: string, patch: UpdateWastageEntryInput, _actor: WastageActor): Promise<WastageEntry> {
    await delay(350);
    const entry = this.mustFind(id);
    const updated: WastageEntry = { ...entry, ...patch, updatedAt: new Date().toISOString() };
    this.entries = this.entries.map((e) => (e.id === id ? updated : e));
    return updated;
  }

  private mustFind(id: string): WastageEntry {
    const entry = this.entries.find((e) => e.id === id);
    if (!entry) throw new Error("Wastage entry not found.");
    return entry;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const wastageAdapter: WastageAdapter = new MockWastageAdapter();

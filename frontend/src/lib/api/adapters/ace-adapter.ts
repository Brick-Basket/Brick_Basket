import type { ACEItem, CreateACEItemInput, UpdateACEItemInput } from "@/types/domain/ace-item";
import type { ContractCategory } from "@/types/domain/contract";
import { mockACEItems } from "@/data/mock/ace-items";

/**
 * Adapter boundary for the Accepted Cost Estimate module. Components/
 * hooks depend on this interface, never on the concrete implementation
 * below — swapping to a real backend means adding `ace-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 8) for full detail:
 *   GET    /api/ace-items          — list, filtered by project/category
 *   GET    /api/ace-items/:id      — detail
 *   POST   /api/ace-items          — create (ace:write)
 *   PATCH  /api/ace-items/:id      — edit (ace:write, projectId immutable)
 */
export interface ACEActor {
  id: string;
  name: string;
}

export interface ACEListParams {
  search?: string;
  category?: ContractCategory;
  projectId?: string;
  sortBy?: "itemDescription" | "rate" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ACEListResult {
  items: ACEItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ACEAdapter {
  list(params?: ACEListParams): Promise<ACEListResult>;
  get(id: string): Promise<ACEItem | null>;
  create(input: CreateACEItemInput, actor: ACEActor): Promise<ACEItem>;
  update(id: string, patch: UpdateACEItemInput, actor: ACEActor): Promise<ACEItem>;
}

class MockACEAdapter implements ACEAdapter {
  private items: ACEItem[] = [...mockACEItems];

  async list(params: ACEListParams = {}): Promise<ACEListResult> {
    await delay(300);
    let items = [...this.items];

    if (params.projectId) items = items.filter((i) => i.projectId === params.projectId);
    if (params.category) items = items.filter((i) => i.category === params.category);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((i) => i.itemDescription.toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "itemDescription";
    const sortDir = params.sortDir ?? "asc";
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

  async get(id: string): Promise<ACEItem | null> {
    await delay(200);
    return this.items.find((i) => i.id === id) ?? null;
  }

  async create(input: CreateACEItemInput, _actor: ACEActor): Promise<ACEItem> {
    await delay(400);
    const now = new Date().toISOString();
    const item: ACEItem = {
      id: `ace_${Math.random().toString(36).slice(2, 10)}`,
      projectId: input.projectId,
      category: input.category,
      itemDescription: input.itemDescription,
      uom: input.uom,
      rate: input.rate,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.items = [item, ...this.items];
    return item;
  }

  async update(id: string, patch: UpdateACEItemInput, _actor: ACEActor): Promise<ACEItem> {
    await delay(350);
    const item = this.mustFind(id);
    const updated: ACEItem = { ...item, ...patch, updatedAt: new Date().toISOString() };
    this.replace(updated);
    return updated;
  }

  private mustFind(id: string): ACEItem {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("ACE item not found.");
    return item;
  }

  private replace(updated: ACEItem) {
    this.items = this.items.map((i) => (i.id === updated.id ? updated : i));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const aceAdapter: ACEAdapter = new MockACEAdapter();

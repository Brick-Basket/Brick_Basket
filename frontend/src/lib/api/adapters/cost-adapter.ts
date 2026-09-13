import type { CostEntry, CreateCostEntryInput, UpdateCostEntryInput } from "@/types/domain/cost-entry";
import type { ContractCategory } from "@/types/domain/contract";
import { mockCostEntries } from "@/data/mock/cost-entries";

/**
 * Adapter boundary for the Project Cost Accounting module. Components/
 * hooks depend on this interface, never on the concrete implementation
 * below — swapping to a real backend means adding
 * `cost-adapter.rest.ts` implementing the same interface and changing the
 * single export at the bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 15) for full detail:
 *   GET    /api/cost-entries          — list, filtered by project/category
 *   GET    /api/cost-entries/:id      — detail
 *   POST   /api/cost-entries          — create (finance:write)
 *   PATCH  /api/cost-entries/:id      — edit (finance:write, projectId/category immutable)
 */
export interface CostActor {
  id: string;
  name: string;
}

export interface CostListParams {
  search?: string;
  category?: ContractCategory;
  projectId?: string;
  sortBy?: "category" | "budgetAmount" | "actualAmount" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CostListResult {
  items: CostEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CostAdapter {
  list(params?: CostListParams): Promise<CostListResult>;
  get(id: string): Promise<CostEntry | null>;
  create(input: CreateCostEntryInput, actor: CostActor): Promise<CostEntry>;
  update(id: string, patch: UpdateCostEntryInput, actor: CostActor): Promise<CostEntry>;
}

class MockCostAdapter implements CostAdapter {
  private items: CostEntry[] = [...mockCostEntries];

  async list(params: CostListParams = {}): Promise<CostListResult> {
    await delay(300);
    let items = [...this.items];

    if (params.projectId) items = items.filter((i) => i.projectId === params.projectId);
    if (params.category) items = items.filter((i) => i.category === params.category);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (i) => i.category.toLowerCase().includes(q) || (i.notes ?? "").toLowerCase().includes(q),
      );
    }

    const sortBy = params.sortBy ?? "category";
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

  async get(id: string): Promise<CostEntry | null> {
    await delay(200);
    return this.items.find((i) => i.id === id) ?? null;
  }

  async create(input: CreateCostEntryInput, _actor: CostActor): Promise<CostEntry> {
    await delay(400);
    const now = new Date().toISOString();
    const item: CostEntry = {
      id: `cost_${Math.random().toString(36).slice(2, 10)}`,
      projectId: input.projectId,
      category: input.category,
      budgetAmount: input.budgetAmount,
      actualAmount: input.actualAmount,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.items = [item, ...this.items];
    return item;
  }

  async update(id: string, patch: UpdateCostEntryInput, _actor: CostActor): Promise<CostEntry> {
    await delay(350);
    const item = this.mustFind(id);
    const updated: CostEntry = { ...item, ...patch, updatedAt: new Date().toISOString() };
    this.replace(updated);
    return updated;
  }

  private mustFind(id: string): CostEntry {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("Cost entry not found.");
    return item;
  }

  private replace(updated: CostEntry) {
    this.items = this.items.map((i) => (i.id === updated.id ? updated : i));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const costAdapter: CostAdapter = new MockCostAdapter();

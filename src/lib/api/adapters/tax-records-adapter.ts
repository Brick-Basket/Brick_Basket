import type { CreateTaxRecordInput, TaxRecord, TaxRecordType, UpdateTaxRecordInput } from "@/types/domain/tax-record";
import { mockTaxRecords } from "@/data/mock/tax-records";

/**
 * Adapter boundary for Taxes & Statutory Accounting (Part 17). Components/
 * hooks depend on this interface, never on the concrete implementation
 * below — swapping to a real backend means adding
 * `tax-records-adapter.rest.ts` implementing the same interface and
 * changing the single export at the bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 17) for full detail:
 *   GET    /api/tax-records          — list, filtered by type/project
 *   GET    /api/tax-records/:id      — detail
 *   POST   /api/tax-records          — create (finance:write)
 *   PATCH  /api/tax-records/:id      — edit (finance:write)
 */
export interface TaxRecordActor {
  id: string;
  name: string;
}

export interface TaxRecordListParams {
  search?: string;
  type?: TaxRecordType;
  projectId?: string;
  sortBy?: "dueDate" | "amount" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface TaxRecordListResult {
  items: TaxRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TaxRecordsAdapter {
  list(params?: TaxRecordListParams): Promise<TaxRecordListResult>;
  get(id: string): Promise<TaxRecord | null>;
  create(input: CreateTaxRecordInput, actor: TaxRecordActor): Promise<TaxRecord>;
  update(id: string, patch: UpdateTaxRecordInput, actor: TaxRecordActor): Promise<TaxRecord>;
}

class MockTaxRecordsAdapter implements TaxRecordsAdapter {
  private items: TaxRecord[] = [...mockTaxRecords];

  async list(params: TaxRecordListParams = {}): Promise<TaxRecordListResult> {
    await delay(300);
    let items = [...this.items];

    if (params.type) items = items.filter((i) => i.type === params.type);
    if (params.projectId) items = items.filter((i) => i.projectId === params.projectId);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || i.authority.toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "dueDate";
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

  async get(id: string): Promise<TaxRecord | null> {
    await delay(200);
    return this.items.find((i) => i.id === id) ?? null;
  }

  async create(input: CreateTaxRecordInput, _actor: TaxRecordActor): Promise<TaxRecord> {
    await delay(400);
    const now = new Date().toISOString();
    const item: TaxRecord = {
      id: `tax_${Math.random().toString(36).slice(2, 10)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.items = [item, ...this.items];
    return item;
  }

  async update(id: string, patch: UpdateTaxRecordInput, _actor: TaxRecordActor): Promise<TaxRecord> {
    await delay(350);
    const item = this.mustFind(id);
    const updated: TaxRecord = { ...item, ...patch, updatedAt: new Date().toISOString() };
    this.items = this.items.map((i) => (i.id === id ? updated : i));
    return updated;
  }

  private mustFind(id: string): TaxRecord {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("Tax record not found.");
    return item;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const taxRecordsAdapter: TaxRecordsAdapter = new MockTaxRecordsAdapter();

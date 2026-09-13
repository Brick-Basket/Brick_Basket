import type { CreateFixedAssetInput, FixedAsset, FixedAssetCategory, UpdateFixedAssetInput } from "@/types/domain/fixed-asset";
import { mockFixedAssets } from "@/data/mock/fixed-assets";

/**
 * Adapter boundary for Fixed Assets (Part 17). Components/hooks depend on
 * this interface, never on the concrete implementation below — swapping
 * to a real backend means adding `fixed-assets-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 17) for full detail:
 *   GET    /api/fixed-assets          — list, filtered by category/project
 *   GET    /api/fixed-assets/:id      — detail
 *   POST   /api/fixed-assets          — create (finance:write)
 *   PATCH  /api/fixed-assets/:id      — edit (finance:write)
 */
export interface FixedAssetActor {
  id: string;
  name: string;
}

export interface FixedAssetListParams {
  search?: string;
  category?: FixedAssetCategory;
  projectId?: string;
  sortBy?: "purchaseDate" | "value" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface FixedAssetListResult {
  items: FixedAsset[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FixedAssetsAdapter {
  list(params?: FixedAssetListParams): Promise<FixedAssetListResult>;
  get(id: string): Promise<FixedAsset | null>;
  create(input: CreateFixedAssetInput, actor: FixedAssetActor): Promise<FixedAsset>;
  update(id: string, patch: UpdateFixedAssetInput, actor: FixedAssetActor): Promise<FixedAsset>;
}

class MockFixedAssetsAdapter implements FixedAssetsAdapter {
  private items: FixedAsset[] = [...mockFixedAssets];

  async list(params: FixedAssetListParams = {}): Promise<FixedAssetListResult> {
    await delay(300);
    let items = [...this.items];

    if (params.category) items = items.filter((i) => i.category === params.category);
    if (params.projectId) items = items.filter((i) => i.projectId === params.projectId);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((i) => i.assetName.toLowerCase().includes(q) || (i.serialNumber ?? "").toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "purchaseDate";
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

  async get(id: string): Promise<FixedAsset | null> {
    await delay(200);
    return this.items.find((i) => i.id === id) ?? null;
  }

  async create(input: CreateFixedAssetInput, _actor: FixedAssetActor): Promise<FixedAsset> {
    await delay(400);
    const now = new Date().toISOString();
    const item: FixedAsset = {
      id: `asset_${Math.random().toString(36).slice(2, 10)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.items = [item, ...this.items];
    return item;
  }

  async update(id: string, patch: UpdateFixedAssetInput, _actor: FixedAssetActor): Promise<FixedAsset> {
    await delay(350);
    const item = this.mustFind(id);
    const updated: FixedAsset = { ...item, ...patch, updatedAt: new Date().toISOString() };
    this.items = this.items.map((i) => (i.id === id ? updated : i));
    return updated;
  }

  private mustFind(id: string): FixedAsset {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("Fixed asset not found.");
    return item;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const fixedAssetsAdapter: FixedAssetsAdapter = new MockFixedAssetsAdapter();

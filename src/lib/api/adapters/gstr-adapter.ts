import type { CreateGSTRRecordInput, GSTRRecord, GSTRRecordType, UpdateGSTRRecordInput } from "@/types/domain/gstr-record";
import { mockGSTRRecords } from "@/data/mock/gstr-records";
import { grnAdapter } from "@/lib/api/adapters/grn-adapter";
import { contractsAdapter } from "@/lib/api/adapters/contracts-adapter";

/**
 * Adapter boundary for GSTR Financial Reporting (Part 17). Components/
 * hooks depend on this interface, never on the concrete implementation
 * below — swapping to a real backend means adding `gstr-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * **Cross-adapter dependency, by design** — same pattern as
 * `InvoiceAdapter.create`/`PaymentAdapter.create` (Part 16): `create`
 * below calls `grnAdapter.get` (for `type: "purchase"`) or
 * `contractsAdapter.get` (for `type: "sales"`, when a `contractId` is
 * given), never their mock arrays directly.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 17) for full detail:
 *   GET    /api/gstr-records          — list, filtered by type/project/period
 *   GET    /api/gstr-records/:id      — detail
 *   POST   /api/gstr-records          — create (finance:write)
 *   PATCH  /api/gstr-records/:id      — edit (finance:write)
 */
export interface GSTRActor {
  id: string;
  name: string;
}

export interface GSTRListParams {
  search?: string;
  type?: GSTRRecordType;
  projectId?: string;
  period?: string;
  sortBy?: "period" | "taxableValue" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface GSTRListResult {
  items: GSTRRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GSTRAdapter {
  list(params?: GSTRListParams): Promise<GSTRListResult>;
  get(id: string): Promise<GSTRRecord | null>;
  create(input: CreateGSTRRecordInput, actor: GSTRActor): Promise<GSTRRecord>;
  update(id: string, patch: UpdateGSTRRecordInput, actor: GSTRActor): Promise<GSTRRecord>;
}

class MockGSTRAdapter implements GSTRAdapter {
  private items: GSTRRecord[] = [...mockGSTRRecords];

  async list(params: GSTRListParams = {}): Promise<GSTRListResult> {
    await delay(300);
    let items = [...this.items];

    if (params.type) items = items.filter((i) => i.type === params.type);
    if (params.projectId) items = items.filter((i) => i.projectId === params.projectId);
    if (params.period) items = items.filter((i) => i.period === params.period);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (i) =>
          (i.invoiceReference ?? "").toLowerCase().includes(q) ||
          (i.saleDescription ?? "").toLowerCase().includes(q) ||
          (i.gstin ?? "").toLowerCase().includes(q),
      );
    }

    const sortBy = params.sortBy ?? "period";
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

  async get(id: string): Promise<GSTRRecord | null> {
    await delay(200);
    return this.items.find((i) => i.id === id) ?? null;
  }

  async create(input: CreateGSTRRecordInput, _actor: GSTRActor): Promise<GSTRRecord> {
    await delay(450);
    const now = new Date().toISOString();

    if (input.type === "purchase") {
      if (!input.grnId) throw new Error("Select the GRN this purchase was received against.");
      const grn = await grnAdapter.get(input.grnId);
      if (!grn) throw new Error("GRN not found.");
      const record: GSTRRecord = {
        id: `gstr_${Math.random().toString(36).slice(2, 10)}`,
        type: "purchase",
        period: input.period,
        projectId: grn.projectId,
        grnId: grn.id,
        vendorId: grn.vendorId,
        gstin: input.gstin,
        taxableValue: input.taxableValue,
        taxAmount: input.taxAmount,
        invoiceReference: input.invoiceReference,
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      };
      this.items = [record, ...this.items];
      return record;
    }

    // type === "sales"
    let projectId = input.projectId;
    let customerId: string | undefined;
    if (input.contractId) {
      const contract = await contractsAdapter.get(input.contractId);
      if (!contract) throw new Error("Contract not found.");
      if (contract.status !== "accepted") throw new Error("A sales GSTR entry can only reference an accepted contract.");
      projectId = contract.projectId ?? projectId;
      customerId = contract.customerId;
    } else if (!input.saleDescription) {
      throw new Error("Either link an accepted contract or describe the sale (e.g. a materials sale).");
    }

    const record: GSTRRecord = {
      id: `gstr_${Math.random().toString(36).slice(2, 10)}`,
      type: "sales",
      period: input.period,
      projectId,
      contractId: input.contractId,
      saleDescription: input.contractId ? undefined : input.saleDescription,
      customerId,
      gstin: input.gstin,
      taxableValue: input.taxableValue,
      taxAmount: input.taxAmount,
      invoiceReference: input.invoiceReference,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.items = [record, ...this.items];
    return record;
  }

  async update(id: string, patch: UpdateGSTRRecordInput, _actor: GSTRActor): Promise<GSTRRecord> {
    await delay(350);
    const item = this.mustFind(id);
    const updated: GSTRRecord = { ...item, ...patch, updatedAt: new Date().toISOString() };
    this.items = this.items.map((i) => (i.id === id ? updated : i));
    return updated;
  }

  private mustFind(id: string): GSTRRecord {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("GSTR record not found.");
    return item;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const gstrAdapter: GSTRAdapter = new MockGSTRAdapter();

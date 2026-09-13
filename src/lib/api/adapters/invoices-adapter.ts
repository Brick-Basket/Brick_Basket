import type { CreateInvoiceInput, Invoice, UpdateInvoiceInput } from "@/types/domain/invoice";
import { mockInvoices } from "@/data/mock/invoices";
import { purchaseOrdersAdapter } from "@/lib/api/adapters/purchase-orders-adapter";

/**
 * Adapter boundary for vendor Invoices (Part 16). Components/hooks depend
 * on this interface, never on the concrete implementation below —
 * swapping to a real backend means adding `invoices-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * **Cross-adapter dependency, by design** — same pattern as
 * `GRNAdapter.create` (Part 11): `create` below calls
 * `purchaseOrdersAdapter.get` (never its mock array directly) to confirm
 * the source PO is `issued` and to snapshot `vendorId`/`projectId`.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 16) for full detail:
 *   GET    /api/invoices          — list, filtered by project/vendor/purchaseOrder
 *   GET    /api/invoices/:id      — detail
 *   POST   /api/invoices          — create against an issued PO (finance:write)
 *   PATCH  /api/invoices/:id      — edit (finance:write, purchaseOrderId immutable)
 */
export interface InvoiceActor {
  id: string;
  name: string;
}

export interface InvoiceListParams {
  search?: string;
  projectId?: string;
  vendorId?: string;
  purchaseOrderId?: string;
  sortBy?: "invoiceDate" | "invoiceAmount" | "createdAt" | "invoiceNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface InvoiceListResult {
  items: Invoice[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InvoiceAdapter {
  list(params?: InvoiceListParams): Promise<InvoiceListResult>;
  get(id: string): Promise<Invoice | null>;
  create(input: CreateInvoiceInput, actor: InvoiceActor): Promise<Invoice>;
  update(id: string, patch: UpdateInvoiceInput, actor: InvoiceActor): Promise<Invoice>;
}

class MockInvoiceAdapter implements InvoiceAdapter {
  private invoices: Invoice[] = [...mockInvoices];

  async list(params: InvoiceListParams = {}): Promise<InvoiceListResult> {
    await delay(300);
    let items = [...this.invoices];

    if (params.projectId) items = items.filter((i) => i.projectId === params.projectId);
    if (params.vendorId) items = items.filter((i) => i.vendorId === params.vendorId);
    if (params.purchaseOrderId) items = items.filter((i) => i.purchaseOrderId === params.purchaseOrderId);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((i) => i.invoiceNumber.toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "invoiceDate";
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

  async get(id: string): Promise<Invoice | null> {
    await delay(200);
    return this.invoices.find((i) => i.id === id) ?? null;
  }

  async create(input: CreateInvoiceInput, _actor: InvoiceActor): Promise<Invoice> {
    await delay(450);
    const purchaseOrder = await purchaseOrdersAdapter.get(input.purchaseOrderId);
    if (!purchaseOrder) throw new Error("Purchase Order not found.");
    if (purchaseOrder.status !== "issued") {
      throw new Error("An invoice can only be recorded against an issued Purchase Order.");
    }

    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: `inv_${Math.random().toString(36).slice(2, 10)}`,
      purchaseOrderId: input.purchaseOrderId,
      vendorId: purchaseOrder.vendorId,
      projectId: purchaseOrder.projectId,
      invoiceNumber: input.invoiceNumber,
      invoiceDate: input.invoiceDate,
      invoiceAmount: input.invoiceAmount,
      invoiceCopyFileName: input.invoiceCopyFileName,
      invoiceCopyFileSizeBytes: input.invoiceCopyFileSizeBytes,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.invoices = [invoice, ...this.invoices];
    return invoice;
  }

  async update(id: string, patch: UpdateInvoiceInput, _actor: InvoiceActor): Promise<Invoice> {
    await delay(350);
    const invoice = this.mustFind(id);
    const updated: Invoice = { ...invoice, ...patch, updatedAt: new Date().toISOString() };
    this.invoices = this.invoices.map((i) => (i.id === id ? updated : i));
    return updated;
  }

  private mustFind(id: string): Invoice {
    const invoice = this.invoices.find((i) => i.id === id);
    if (!invoice) throw new Error("Invoice not found.");
    return invoice;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const invoiceAdapter: InvoiceAdapter = new MockInvoiceAdapter();

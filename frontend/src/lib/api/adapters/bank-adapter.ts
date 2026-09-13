import type { BankTransaction, CreateBankTransactionInput, UpdateBankTransactionInput } from "@/types/domain/bank-transaction";
import { mockBankTransactions } from "@/data/mock/bank-transactions";
import { paymentAdapter } from "@/lib/api/adapters/payments-adapter";

/**
 * Adapter boundary for Bank & Cash Management (Part 16, §8C). Components/
 * hooks depend on this interface, never on the concrete implementation
 * below — swapping to a real backend means adding `bank-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * Unlike every other cross-adapter dependency in this app, `paymentId` is
 * an *optional* reference — `create`/`update` validate it against
 * `paymentAdapter.get` (never its mock array directly) only when
 * provided, since the owner's field list clearly anticipates entries
 * with no modeled `Payment` behind them at all (e.g. a small cash
 * purchase) — see `bank-transaction.ts`'s header comment.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 16) for full detail:
 *   GET    /api/bank-transactions          — list, filtered by project/year/party
 *   GET    /api/bank-transactions/:id      — detail
 *   POST   /api/bank-transactions          — create (finance:write)
 *   PATCH  /api/bank-transactions/:id      — edit (finance:write)
 */
export interface BankTransactionActor {
  id: string;
  name: string;
}

export interface BankTransactionListParams {
  search?: string;
  projectId?: string;
  yearOfExecution?: number;
  sortBy?: "createdAt" | "paymentAmount" | "yearOfExecution";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface BankTransactionListResult {
  items: BankTransaction[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BankTransactionAdapter {
  list(params?: BankTransactionListParams): Promise<BankTransactionListResult>;
  get(id: string): Promise<BankTransaction | null>;
  create(input: CreateBankTransactionInput, actor: BankTransactionActor): Promise<BankTransaction>;
  update(id: string, patch: UpdateBankTransactionInput, actor: BankTransactionActor): Promise<BankTransaction>;
}

class MockBankTransactionAdapter implements BankTransactionAdapter {
  private items: BankTransaction[] = [...mockBankTransactions];

  async list(params: BankTransactionListParams = {}): Promise<BankTransactionListResult> {
    await delay(300);
    let items = [...this.items];

    if (params.projectId) items = items.filter((t) => t.projectId === params.projectId);
    if (params.yearOfExecution) items = items.filter((t) => t.yearOfExecution === params.yearOfExecution);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (t) => t.partyOrVendorCode.toLowerCase().includes(q) || t.invoiceNumber.toLowerCase().includes(q),
      );
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

  async get(id: string): Promise<BankTransaction | null> {
    await delay(200);
    return this.items.find((t) => t.id === id) ?? null;
  }

  async create(input: CreateBankTransactionInput, _actor: BankTransactionActor): Promise<BankTransaction> {
    await delay(400);
    if (input.paymentId) {
      const payment = await paymentAdapter.get(input.paymentId);
      if (!payment) throw new Error("Payment not found.");
    }

    const now = new Date().toISOString();
    const item: BankTransaction = {
      id: `bank_${Math.random().toString(36).slice(2, 10)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.items = [item, ...this.items];
    return item;
  }

  async update(id: string, patch: UpdateBankTransactionInput, _actor: BankTransactionActor): Promise<BankTransaction> {
    await delay(350);
    if (patch.paymentId) {
      const payment = await paymentAdapter.get(patch.paymentId);
      if (!payment) throw new Error("Payment not found.");
    }
    const item = this.mustFind(id);
    const updated: BankTransaction = { ...item, ...patch, updatedAt: new Date().toISOString() };
    this.items = this.items.map((t) => (t.id === id ? updated : t));
    return updated;
  }

  private mustFind(id: string): BankTransaction {
    const item = this.items.find((t) => t.id === id);
    if (!item) throw new Error("Bank transaction not found.");
    return item;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const bankTransactionAdapter: BankTransactionAdapter = new MockBankTransactionAdapter();

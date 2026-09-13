import type { CreatePaymentInput, Payment, UpdatePaymentInput } from "@/types/domain/payment";
import { mockPayments } from "@/data/mock/payments";
import { invoiceAdapter } from "@/lib/api/adapters/invoices-adapter";
import { contractsAdapter } from "@/lib/api/adapters/contracts-adapter";

/**
 * Adapter boundary for Payments & Receipts (Part 16). Components/hooks
 * depend on this interface, never on the concrete implementation below —
 * swapping to a real backend means adding `payments-adapter.rest.ts`
 * implementing the same interface and changing the single export at the
 * bottom of this file.
 *
 * **Cross-adapter dependency, by design** — same pattern as
 * `InvoiceAdapter.create`: `create` below calls `invoiceAdapter.get`
 * (for `direction: "payment"`) or `contractsAdapter.get` (for
 * `direction: "receipt"`), never their mock arrays directly, to validate
 * the reference and snapshot `vendorId`/`customerId`.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 16) for full detail:
 *   GET    /api/payments          — list, filtered by direction/project/invoice/contract
 *   GET    /api/payments/:id      — detail
 *   POST   /api/payments          — create (finance:write)
 *   PATCH  /api/payments/:id      — edit (finance:write, direction/references immutable)
 */
export interface PaymentActor {
  id: string;
  name: string;
}

export interface PaymentListParams {
  search?: string;
  direction?: Payment["direction"];
  projectId?: string;
  invoiceId?: string;
  contractId?: string;
  /** The customer portal's `/dashboard/payments` always passes its own signed-in customer id. */
  customerId?: string;
  sortBy?: "paymentDate" | "amount" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PaymentListResult {
  items: Payment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaymentAdapter {
  list(params?: PaymentListParams): Promise<PaymentListResult>;
  get(id: string): Promise<Payment | null>;
  create(input: CreatePaymentInput, actor: PaymentActor): Promise<Payment>;
  update(id: string, patch: UpdatePaymentInput, actor: PaymentActor): Promise<Payment>;
}

class MockPaymentAdapter implements PaymentAdapter {
  private payments: Payment[] = [...mockPayments];

  async list(params: PaymentListParams = {}): Promise<PaymentListResult> {
    await delay(300);
    let items = [...this.payments];

    if (params.direction) items = items.filter((p) => p.direction === params.direction);
    if (params.projectId) items = items.filter((p) => p.projectId === params.projectId);
    if (params.invoiceId) items = items.filter((p) => p.invoiceId === params.invoiceId);
    if (params.contractId) items = items.filter((p) => p.contractId === params.contractId);
    if (params.customerId) items = items.filter((p) => p.customerId === params.customerId);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((p) => (p.referenceNumber ?? "").toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "paymentDate";
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

  async get(id: string): Promise<Payment | null> {
    await delay(200);
    return this.payments.find((p) => p.id === id) ?? null;
  }

  async create(input: CreatePaymentInput, _actor: PaymentActor): Promise<Payment> {
    await delay(450);
    let vendorId: string | undefined;
    let customerId: string | undefined;

    if (input.direction === "payment") {
      if (!input.invoiceId) throw new Error("Select an invoice for a vendor payment.");
      const invoice = await invoiceAdapter.get(input.invoiceId);
      if (!invoice) throw new Error("Invoice not found.");
      vendorId = invoice.vendorId;
    } else {
      if (!input.contractId) throw new Error("Select a contract for a customer receipt.");
      const contract = await contractsAdapter.get(input.contractId);
      if (!contract) throw new Error("Contract not found.");
      if (contract.status !== "accepted") {
        throw new Error("A receipt can only be recorded against an accepted contract.");
      }
      customerId = contract.customerId;
    }

    const now = new Date().toISOString();
    const payment: Payment = {
      id: `pay_${Math.random().toString(36).slice(2, 10)}`,
      direction: input.direction,
      projectId: input.projectId,
      invoiceId: input.direction === "payment" ? input.invoiceId : undefined,
      vendorId,
      contractId: input.direction === "receipt" ? input.contractId : undefined,
      customerId,
      amount: input.amount,
      paymentDate: input.paymentDate,
      mode: input.mode,
      referenceNumber: input.referenceNumber,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.payments = [payment, ...this.payments];
    return payment;
  }

  async update(id: string, patch: UpdatePaymentInput, _actor: PaymentActor): Promise<Payment> {
    await delay(350);
    const payment = this.mustFind(id);
    const updated: Payment = { ...payment, ...patch, updatedAt: new Date().toISOString() };
    this.payments = this.payments.map((p) => (p.id === id ? updated : p));
    return updated;
  }

  private mustFind(id: string): Payment {
    const payment = this.payments.find((p) => p.id === id);
    if (!payment) throw new Error("Payment not found.");
    return payment;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const paymentAdapter: PaymentAdapter = new MockPaymentAdapter();

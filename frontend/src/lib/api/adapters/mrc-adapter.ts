import type { CreateMRCInput, MRC, MRCLineItem, MRCStatus, UpdateMRCInput } from "@/types/domain/mrc";
import { mockMRCs, mockMRCLineItems } from "@/data/mock/mrc";
import { grnAdapter } from "@/lib/api/adapters/grn-adapter";
import { customersAdapter } from "@/lib/api/adapters/customers-adapter";

/**
 * Adapter boundary for Material Receipt Certificates (Part 12).
 * Components/hooks depend on this interface, never on the concrete
 * implementation below — swapping to a real backend means adding
 * `mrc-adapter.rest.ts` implementing the same interface and changing the
 * single export at the bottom of this file.
 *
 * **Cross-adapter dependency, by design** — same pattern as
 * `GRNAdapter.create`/`PurchaseOrdersAdapter.create`: `create`/`update`
 * below call `grnAdapter`'s own methods (never its mock arrays directly)
 * to snapshot a `source: "grn"` line's description/UOM/make and to cap its
 * quantity at what was actually received, and call `customersAdapter`'s
 * own methods to confirm the target customer exists. A real backend would
 * do the equivalent joins against the GRN Line Item and Customer tables
 * at MRC-creation time.
 *
 * Unlike Contract/Requisition/PO, this module has no dedicated audit-log
 * entity — see docs/OPEN_QUESTIONS.md #33, the same scope reduction
 * already applied to RFQ and GRN (Part 9/11), since the owner's Part 12
 * bullet list doesn't ask for a "History" section.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 12) for full detail:
 *   GET    /api/mrc                    — list, filtered by customer/project/status
 *   GET    /api/mrc/:id                 — detail
 *   GET    /api/mrc/:id/line-items       — this MRC's line items
 *   POST   /api/mrc                     — create (status: "draft", mrc:issue)
 *   PATCH  /api/mrc/:id                  — edit (only while draft/declined, mrc:issue)
 *   POST   /api/mrc/:id/issue            — admin/store: issue for customer acceptance (mrc:issue)
 *   POST   /api/mrc/:id/withdraw         — admin/store: recall back to draft (mrc:issue)
 *   POST   /api/mrc/:id/respond          — customer: accept or decline (mrc:accept)
 */
export interface MRCActor {
  id: string;
  name: string;
}

export interface MRCListParams {
  search?: string;
  status?: MRCStatus;
  customerId?: string;
  projectId?: string;
  sortBy?: "createdAt" | "updatedAt" | "status" | "mrcNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface MRCListResult {
  items: MRC[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MRCAdapter {
  list(params?: MRCListParams): Promise<MRCListResult>;
  get(id: string): Promise<MRC | null>;
  listLineItems(mrcId: string): Promise<MRCLineItem[]>;
  create(input: CreateMRCInput, actor: MRCActor): Promise<MRC>;
  update(id: string, patch: UpdateMRCInput, actor: MRCActor): Promise<MRC>;
  issue(id: string, actor: MRCActor): Promise<MRC>;
  withdraw(id: string, actor: MRCActor): Promise<MRC>;
  respond(id: string, decision: "accepted" | "declined", actor: MRCActor, declineReason?: string): Promise<MRC>;
}

/**
 * In-memory mock implementation. Simulates network latency so loading
 * states are exercised before a real API exists. Data does not persist
 * across a full page reload — demo behavior, not backend persistence.
 */
class MockMRCAdapter implements MRCAdapter {
  private mrcs: MRC[] = [...mockMRCs];
  private lineItems: MRCLineItem[] = [...mockMRCLineItems];

  async list(params: MRCListParams = {}): Promise<MRCListResult> {
    await delay(300);
    let items = [...this.mrcs];

    if (params.customerId) items = items.filter((m) => m.customerId === params.customerId);
    if (params.projectId) items = items.filter((m) => m.projectId === params.projectId);
    if (params.status) items = items.filter((m) => m.status === params.status);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((m) => m.mrcNumber.toLowerCase().includes(q));
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

  async get(id: string): Promise<MRC | null> {
    await delay(200);
    return this.mrcs.find((m) => m.id === id) ?? null;
  }

  async listLineItems(mrcId: string): Promise<MRCLineItem[]> {
    await delay(200);
    return this.lineItems.filter((l) => l.mrcId === mrcId);
  }

  async create(input: CreateMRCInput, _actor: MRCActor): Promise<MRC> {
    await delay(500);
    const customer = await customersAdapter.get(input.customerId);
    if (!customer) throw new Error("Select a valid customer.");
    if (input.lines.length === 0) throw new Error("Add at least one material line.");

    const now = new Date().toISOString();
    const mrc: MRC = {
      id: `mrc_${Math.random().toString(36).slice(2, 10)}`,
      mrcNumber: `BB-MRC-${new Date().getFullYear()}-${String(this.mrcs.length + 1).padStart(3, "0")}`,
      customerId: input.customerId,
      projectId: input.projectId,
      status: "draft",
      notes: input.notes,
      issuedAt: null,
      respondedAt: null,
      declineReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.mrcs = [mrc, ...this.mrcs];
    this.lineItems = [...this.lineItems, ...(await this.buildLineItems(mrc.id, input.lines))];
    return mrc;
  }

  async update(id: string, patch: UpdateMRCInput, _actor: MRCActor): Promise<MRC> {
    await delay(400);
    const mrc = this.mustFind(id);
    if (mrc.status !== "draft" && mrc.status !== "declined") {
      throw new Error("This MRC can no longer be edited — only draft or declined certificates can be updated.");
    }
    // Revising a declined MRC resets it to "draft" — same frontend
    // implementation decision as Contract's decline/revise pattern (see
    // contract.ts and docs/OPEN_QUESTIONS.md #22), not owner-confirmed.
    const wasDeclined = mrc.status === "declined";
    const updated: MRC = {
      ...mrc,
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(wasDeclined ? { status: "draft" as const, respondedAt: null, declineReason: null } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.mrcs = this.mrcs.map((m) => (m.id === id ? updated : m));

    if (patch.lines) {
      this.lineItems = this.lineItems.filter((l) => l.mrcId !== id);
      this.lineItems = [...this.lineItems, ...(await this.buildLineItems(id, patch.lines))];
    }

    return updated;
  }

  async issue(id: string, _actor: MRCActor): Promise<MRC> {
    await delay(400);
    const mrc = this.mustFind(id);
    if (mrc.status !== "draft") {
      throw new Error("Only a draft MRC can be issued for customer acceptance.");
    }
    const updated: MRC = { ...mrc, status: "issued", issuedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.mrcs = this.mrcs.map((m) => (m.id === id ? updated : m));
    return updated;
  }

  async withdraw(id: string, _actor: MRCActor): Promise<MRC> {
    await delay(400);
    const mrc = this.mustFind(id);
    if (mrc.status !== "issued") {
      throw new Error("Only an MRC awaiting acceptance can be withdrawn.");
    }
    const updated: MRC = { ...mrc, status: "draft", issuedAt: null, updatedAt: new Date().toISOString() };
    this.mrcs = this.mrcs.map((m) => (m.id === id ? updated : m));
    return updated;
  }

  async respond(id: string, decision: "accepted" | "declined", actor: MRCActor, declineReason?: string): Promise<MRC> {
    await delay(450);
    const mrc = this.mustFind(id);
    if (mrc.status !== "issued") {
      throw new Error("This MRC is not currently awaiting your response.");
    }
    const updated: MRC = {
      ...mrc,
      status: decision,
      respondedAt: new Date().toISOString(),
      declineReason: decision === "declined" ? declineReason ?? null : null,
      updatedAt: new Date().toISOString(),
    };
    this.mrcs = this.mrcs.map((m) => (m.id === id ? updated : m));
    void actor; // no audit log to append to here (see header comment) — kept in the signature to match Contract's `respond`, in case one is added later
    return updated;
  }

  private async buildLineItems(mrcId: string, lines: CreateMRCInput["lines"]): Promise<MRCLineItem[]> {
    const built: MRCLineItem[] = [];
    for (const line of lines) {
      if (line.source === "grn") {
        const grnLine = await grnAdapter.getLineItem(line.grnLineItemId);
        if (!grnLine) throw new Error("One of the selected received lines could not be found.");
        if (line.quantity > grnLine.receivedQuantity) {
          throw new Error(`Can't certify more than what was received (${grnLine.receivedQuantity} ${grnLine.uom}) for "${grnLine.description}".`);
        }
        built.push({
          id: `mrcli_${Math.random().toString(36).slice(2, 10)}`,
          mrcId,
          source: "grn",
          grnLineItemId: grnLine.id,
          description: grnLine.description,
          uom: grnLine.uom,
          quantity: line.quantity,
          make: grnLine.brand ?? "—",
          warrantyTerms: line.warrantyTerms ?? grnLine.warrantyCertificateNumber,
        });
      } else {
        built.push({
          id: `mrcli_${Math.random().toString(36).slice(2, 10)}`,
          mrcId,
          source: "manual",
          description: line.description,
          uom: line.uom,
          quantity: line.quantity,
          make: line.make,
          warrantyTerms: line.warrantyTerms,
        });
      }
    }
    return built;
  }

  private mustFind(id: string): MRC {
    const mrc = this.mrcs.find((m) => m.id === id);
    if (!mrc) throw new Error("MRC not found.");
    return mrc;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mrcAdapter: MRCAdapter = new MockMRCAdapter();

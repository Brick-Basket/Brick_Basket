import type { Contract, ContractStatus, CreateContractInput, UpdateContractInput } from "@/types/domain/contract";
import type { ContractAuditEntry } from "@/types/domain/contract-audit";
import { mockContracts } from "@/data/mock/contracts";
import { mockContractAudit } from "@/data/mock/contract-audit";

/**
 * Adapter boundary for the Contract module. Components/hooks depend on
 * this interface, never on the concrete implementation below — swapping
 * to a real backend means adding `contracts-adapter.rest.ts` implementing
 * the same interface and changing the single export at the bottom of
 * this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 5) for full detail:
 *   GET    /api/contracts                    — list, filtered by customerId for the portal
 *   GET    /api/contracts/:id                — detail
 *   POST   /api/contracts                    — create (admin, status: "draft")
 *   PATCH  /api/contracts/:id                 — edit (admin, only while draft/declined)
 *   POST   /api/contracts/:id/send            — admin: send for acceptance
 *   POST   /api/contracts/:id/withdraw        — admin: recall back to draft
 *   POST   /api/contracts/:id/respond         — customer: accept or decline
 *   GET    /api/contracts/:id/audit           — acceptance/audit history
 */
export interface ContractListParams {
  search?: string;
  status?: ContractStatus;
  customerId?: string;
  sortBy?: "createdAt" | "updatedAt" | "status" | "title";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ContractListResult {
  items: Contract[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContractActor {
  id: string;
  name: string;
}

export interface ContractsAdapter {
  list(params?: ContractListParams): Promise<ContractListResult>;
  get(id: string): Promise<Contract | null>;
  create(input: CreateContractInput, file: File | null, actor: ContractActor): Promise<Contract>;
  update(id: string, patch: UpdateContractInput, file: File | null | undefined, actor: ContractActor): Promise<Contract>;
  sendForAcceptance(id: string, actor: ContractActor): Promise<Contract>;
  withdraw(id: string, actor: ContractActor): Promise<Contract>;
  respond(id: string, decision: "accepted" | "declined", actor: ContractActor, declineReason?: string): Promise<Contract>;
  listAuditHistory(contractId: string): Promise<ContractAuditEntry[]>;
  /** Mock-only, session-lived object URL for an uploaded "contract format" attachment — same convention as `DocumentsAdapter.getPreviewUrl`. Never part of the real backend contract. */
  getAttachmentPreviewUrl(contractId: string): string | null;
}

/**
 * In-memory mock implementation. Simulates network latency so loading
 * states are exercised before a real API exists. Data does not persist
 * across a full page reload — demo behavior, not backend persistence.
 */
class MockContractsAdapter implements ContractsAdapter {
  private contracts: Contract[] = [...mockContracts];
  private audit: ContractAuditEntry[] = [...mockContractAudit];
  private objectUrls = new Map<string, string>();

  /**
   * FRONTEND IMPLEMENTATION DECISION (owner correction #1 — "Contract
   * reference number should be written as BB/State name/City Name/year/00001"):
   * the 5-digit sequence is scoped per state+city+financial-year, matching
   * how Indian branch/office reference numbers conventionally reset each
   * year rather than counting up forever across the whole company. Not
   * owner-confirmed either way — see docs/OPEN_QUESTIONS.md.
   */
  private generateContractNumber(state: string, city: string): string {
    const year = new Date().getFullYear();
    const stateSlug = state.replace(/\s+/g, "");
    const citySlug = city.replace(/\s+/g, "");
    const existingForScope = this.contracts.filter(
      (c) => c.state === state && c.city === city && new Date(c.createdAt).getFullYear() === year,
    ).length;
    const sequence = String(existingForScope + 1).padStart(5, "0");
    return `BB/${stateSlug}/${citySlug}/${year}/${sequence}`;
  }

  async list(params: ContractListParams = {}): Promise<ContractListResult> {
    await delay(300);
    let items = [...this.contracts];

    if (params.customerId) items = items.filter((c) => c.customerId === params.customerId);
    if (params.status) items = items.filter((c) => c.status === params.status);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.contractNumber.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q),
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

  async get(id: string): Promise<Contract | null> {
    await delay(200);
    return this.contracts.find((c) => c.id === id) ?? null;
  }

  async create(input: CreateContractInput, file: File | null, actor: ContractActor): Promise<Contract> {
    await delay(500);
    const now = new Date().toISOString();
    const contract: Contract = {
      id: `contract_${Math.random().toString(36).slice(2, 10)}`,
      contractNumber: this.generateContractNumber(input.state, input.city),
      title: input.title,
      customerId: input.customerId,
      leadId: input.leadId,
      projectId: input.projectId,
      city: input.city,
      state: input.state,
      contractCategory: input.contractCategory,
      servicesDescription: input.contractCategory === "large_construction" ? input.servicesDescription : undefined,
      packageCriteria: input.contractCategory === "ihb" ? input.packageCriteria : undefined,
      attachment: file ? { fileName: file.name, fileType: file.type, fileSizeBytes: file.size } : undefined,
      contractDate: input.contractDate,
      status: "draft",
      lineItems: input.lineItems.map((li) => ({ ...li, id: `li_${Math.random().toString(36).slice(2, 10)}` })),
      notes: input.notes,
      sentAt: null,
      respondedAt: null,
      declineReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.contracts = [contract, ...this.contracts];
    if (file) this.objectUrls.set(contract.id, URL.createObjectURL(file));
    this.pushAudit(contract.id, "created", "Contract created.", actor);
    return contract;
  }

  async update(id: string, patch: UpdateContractInput, file: File | null | undefined, actor: ContractActor): Promise<Contract> {
    await delay(400);
    const contract = this.mustFind(id);
    if (contract.status !== "draft" && contract.status !== "declined") {
      throw new Error("This contract can no longer be edited — only draft or declined contracts can be updated.");
    }
    // Revising a declined contract resets it to "draft" so it has a normal
    // path back to "Send for Acceptance" — a FRONTEND IMPLEMENTATION
    // DECISION (see contract.ts's header comment and docs/OPEN_QUESTIONS.md
    // #3), since the owner requirements don't define a revision workflow.
    const wasDeclined = contract.status === "declined";
    const nextCategory = patch.contractCategory ?? contract.contractCategory;
    const updated: Contract = {
      ...contract,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.city !== undefined ? { city: patch.city } : {}),
      ...(patch.state !== undefined ? { state: patch.state } : {}),
      ...(patch.contractCategory !== undefined ? { contractCategory: patch.contractCategory } : {}),
      servicesDescription: nextCategory === "large_construction" ? patch.servicesDescription ?? contract.servicesDescription : undefined,
      packageCriteria: nextCategory === "ihb" ? patch.packageCriteria ?? contract.packageCriteria : undefined,
      ...(patch.contractDate !== undefined ? { contractDate: patch.contractDate } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.lineItems
        ? { lineItems: patch.lineItems.map((li) => ({ ...li, id: `li_${Math.random().toString(36).slice(2, 10)}` })) }
        : {}),
      ...(wasDeclined ? { status: "draft" as const, respondedAt: null, declineReason: null } : {}),
      updatedAt: new Date().toISOString(),
    };
    if (file) {
      const existing = this.objectUrls.get(id);
      if (existing) URL.revokeObjectURL(existing);
      this.objectUrls.set(id, URL.createObjectURL(file));
      updated.attachment = { fileName: file.name, fileType: file.type, fileSizeBytes: file.size };
    }
    this.replace(updated);
    this.pushAudit(
      id,
      "updated",
      wasDeclined ? "Contract revised after decline — reset to draft, ready to send again." : "Contract details updated.",
      actor,
    );
    return updated;
  }

  async sendForAcceptance(id: string, actor: ContractActor): Promise<Contract> {
    await delay(400);
    const contract = this.mustFind(id);
    if (contract.status !== "draft") {
      throw new Error("Only a draft contract can be sent for acceptance.");
    }
    const updated: Contract = { ...contract, status: "sent_for_acceptance", sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.replace(updated);
    this.pushAudit(id, "sent_for_acceptance", "Sent to the customer for review and acceptance.", actor);
    return updated;
  }

  async withdraw(id: string, actor: ContractActor): Promise<Contract> {
    await delay(400);
    const contract = this.mustFind(id);
    if (contract.status !== "sent_for_acceptance") {
      throw new Error("Only a contract awaiting acceptance can be withdrawn.");
    }
    const updated: Contract = { ...contract, status: "draft", sentAt: null, updatedAt: new Date().toISOString() };
    this.replace(updated);
    this.pushAudit(id, "withdrawn", "Withdrawn back to draft for revision.", actor);
    return updated;
  }

  async respond(
    id: string,
    decision: "accepted" | "declined",
    actor: ContractActor,
    declineReason?: string,
  ): Promise<Contract> {
    await delay(450);
    const contract = this.mustFind(id);
    if (contract.status !== "sent_for_acceptance") {
      throw new Error("This contract is not currently awaiting your response.");
    }
    const updated: Contract = {
      ...contract,
      status: decision,
      respondedAt: new Date().toISOString(),
      declineReason: decision === "declined" ? declineReason ?? null : null,
      updatedAt: new Date().toISOString(),
    };
    this.replace(updated);
    this.pushAudit(
      id,
      decision,
      decision === "accepted"
        ? `Accepted by ${actor.name}.`
        : `Declined by ${actor.name}${declineReason ? `: ${declineReason}` : "."}`,
      actor,
    );
    return updated;
  }

  async listAuditHistory(contractId: string): Promise<ContractAuditEntry[]> {
    await delay(250);
    return this.audit.filter((a) => a.contractId === contractId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  getAttachmentPreviewUrl(contractId: string): string | null {
    return this.objectUrls.get(contractId) ?? null;
  }

  private mustFind(id: string): Contract {
    const contract = this.contracts.find((c) => c.id === id);
    if (!contract) throw new Error("Contract not found.");
    return contract;
  }

  private replace(updated: Contract) {
    this.contracts = this.contracts.map((c) => (c.id === updated.id ? updated : c));
  }

  private pushAudit(contractId: string, action: ContractAuditEntry["action"], message: string, actor: { id: string; name: string }) {
    const entry: ContractAuditEntry = {
      id: `caud_${Math.random().toString(36).slice(2, 10)}`,
      contractId,
      action,
      message,
      actorId: actor.id,
      actorName: actor.name,
      createdAt: new Date().toISOString(),
    };
    this.audit = [entry, ...this.audit];
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const contractsAdapter: ContractsAdapter = new MockContractsAdapter();

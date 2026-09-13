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
  create(input: CreateContractInput, actor: ContractActor): Promise<Contract>;
  update(id: string, patch: UpdateContractInput, actor: ContractActor): Promise<Contract>;
  sendForAcceptance(id: string, actor: ContractActor): Promise<Contract>;
  withdraw(id: string, actor: ContractActor): Promise<Contract>;
  respond(id: string, decision: "accepted" | "declined", actor: ContractActor, declineReason?: string): Promise<Contract>;
  listAuditHistory(contractId: string): Promise<ContractAuditEntry[]>;
}

/**
 * In-memory mock implementation. Simulates network latency so loading
 * states are exercised before a real API exists. Data does not persist
 * across a full page reload — demo behavior, not backend persistence.
 */
class MockContractsAdapter implements ContractsAdapter {
  private contracts: Contract[] = [...mockContracts];
  private audit: ContractAuditEntry[] = [...mockContractAudit];

  async list(params: ContractListParams = {}): Promise<ContractListResult> {
    await delay(300);
    let items = [...this.contracts];

    if (params.customerId) items = items.filter((c) => c.customerId === params.customerId);
    if (params.status) items = items.filter((c) => c.status === params.status);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (c) => c.title.toLowerCase().includes(q) || c.contractNumber.toLowerCase().includes(q),
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

  async create(input: CreateContractInput, actor: ContractActor): Promise<Contract> {
    await delay(500);
    const now = new Date().toISOString();
    const contract: Contract = {
      id: `contract_${Math.random().toString(36).slice(2, 10)}`,
      contractNumber: `BB-CNT-${new Date().getFullYear()}-${String(this.contracts.length + 1).padStart(3, "0")}`,
      title: input.title,
      customerId: input.customerId,
      leadId: input.leadId,
      projectId: input.projectId,
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
    this.pushAudit(contract.id, "created", "Contract created.", actor);
    return contract;
  }

  async update(id: string, patch: UpdateContractInput, actor: ContractActor): Promise<Contract> {
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
    const updated: Contract = {
      ...contract,
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      ...(patch.lineItems
        ? { lineItems: patch.lineItems.map((li) => ({ ...li, id: `li_${Math.random().toString(36).slice(2, 10)}` })) }
        : {}),
      ...(wasDeclined ? { status: "draft" as const, respondedAt: null, declineReason: null } : {}),
      updatedAt: new Date().toISOString(),
    };
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

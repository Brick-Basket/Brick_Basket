import type { CreateLeadInput, Lead, LeadStatus, UpdateLeadInput } from "@/types/domain/lead";
import type { LeadActivity } from "@/types/domain/lead-activity";
import { mockLeads } from "@/data/mock/leads";
import { mockLeadActivities } from "@/data/mock/lead-activities";

/**
 * Adapter boundary for the Lead module. Components/hooks depend on this
 * interface, never on the concrete implementation below — swapping to a
 * real backend means adding `leads-adapter.rest.ts` implementing the same
 * interface and changing the single export at the bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 4) for full detail:
 *   POST   /api/leads              — create (public Contact form, Part 2)
 *   GET    /api/leads              — list, with query/sort/pagination (Part 4)
 *   GET    /api/leads/:id          — detail (Part 4)
 *   PATCH  /api/leads/:id          — update fields incl. assignment (Part 4)
 *   POST   /api/leads/:id/status   — pipeline-status transition (Part 4)
 *   GET    /api/leads/:id/activities   — follow-up log (Part 4)
 *   POST   /api/leads/:id/activities   — append a follow-up note (Part 4)
 */
export interface LeadListParams {
  search?: string;
  source?: string;
  status?: string;
  assignedTo?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "status";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface LeadListResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LeadsAdapter {
  list(params?: LeadListParams): Promise<LeadListResult>;
  get(id: string): Promise<Lead | null>;
  create(input: CreateLeadInput): Promise<Lead>;
  update(id: string, patch: UpdateLeadInput): Promise<Lead>;
  transition(id: string, status: LeadStatus): Promise<Lead>;
  listActivities(leadId: string): Promise<LeadActivity[]>;
  addActivity(leadId: string, message: string, author: { id: string; name: string }): Promise<LeadActivity>;
}

/**
 * In-memory mock implementation. Simulates network latency so loading
 * states are exercised in the UI even before a real API exists. Data does
 * not persist across a full page reload — this is demo behavior, not
 * backend persistence, and must never be presented to the user as saved.
 */
class MockLeadsAdapter implements LeadsAdapter {
  private leads: Lead[] = [...mockLeads];
  private activities: LeadActivity[] = [...mockLeadActivities];

  async list(params: LeadListParams = {}): Promise<LeadListResult> {
    await delay(300);
    let items = [...this.leads];

    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q),
      );
    }
    if (params.source) items = items.filter((l) => l.source === params.source);
    if (params.status) items = items.filter((l) => l.status === params.status);
    if (params.assignedTo) {
      items = items.filter((l) =>
        params.assignedTo === "unassigned" ? l.assignedTo === null : l.assignedTo === params.assignedTo,
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
    const pageItems = items.slice(start, start + pageSize);

    return { items: pageItems, total, page, pageSize };
  }

  async get(id: string): Promise<Lead | null> {
    await delay(200);
    return this.leads.find((l) => l.id === id) ?? null;
  }

  async create(input: CreateLeadInput): Promise<Lead> {
    await delay(500);
    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead_${Math.random().toString(36).slice(2, 10)}`,
      status: "new",
      assignedTo: null,
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    this.leads = [lead, ...this.leads];
    return lead;
  }

  async update(id: string, patch: UpdateLeadInput): Promise<Lead> {
    await delay(400);
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error("Lead not found.");
    const current = this.leads[index];
    if (!current) throw new Error("Lead not found.");
    const updated: Lead = { ...current, ...patch, updatedAt: new Date().toISOString() };
    this.leads = [...this.leads.slice(0, index), updated, ...this.leads.slice(index + 1)];
    return updated;
  }

  async transition(id: string, status: LeadStatus): Promise<Lead> {
    await delay(350);
    const index = this.leads.findIndex((l) => l.id === id);
    if (index === -1) throw new Error("Lead not found.");
    const previous = this.leads[index];
    if (!previous) throw new Error("Lead not found.");
    const updated: Lead = { ...previous, status, updatedAt: new Date().toISOString() };
    this.leads = [...this.leads.slice(0, index), updated, ...this.leads.slice(index + 1)];

    if (previous.status !== status) {
      const activity: LeadActivity = {
        id: `act_${Math.random().toString(36).slice(2, 10)}`,
        leadId: id,
        type: "status_change",
        message: `Status changed from "${previous.status}" to "${status}".`,
        authorId: "system",
        authorName: "System",
        createdAt: new Date().toISOString(),
      };
      this.activities = [activity, ...this.activities];
    }
    return updated;
  }

  async listActivities(leadId: string): Promise<LeadActivity[]> {
    await delay(250);
    return this.activities
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async addActivity(
    leadId: string,
    message: string,
    author: { id: string; name: string },
  ): Promise<LeadActivity> {
    await delay(350);
    const activity: LeadActivity = {
      id: `act_${Math.random().toString(36).slice(2, 10)}`,
      leadId,
      type: "note",
      message,
      authorId: author.id,
      authorName: author.name,
      createdAt: new Date().toISOString(),
    };
    this.activities = [activity, ...this.activities];
    return activity;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const leadsAdapter: LeadsAdapter = new MockLeadsAdapter();

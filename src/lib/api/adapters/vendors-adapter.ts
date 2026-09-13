import type {
  CreateVendorAssessmentInput,
  CreateVendorInput,
  CreateVendorPastWorkInput,
  UpdateVendorInput,
  Vendor,
  VendorAssessment,
  VendorCodeSeriesCategory,
  VendorGSTCategory,
  VendorNature,
  VendorPastWorkEntry,
} from "@/types/domain/vendor";
import { assignVendorCode } from "@/components/vendors/vendor-config";
import { computeAverageRating } from "@/components/vendors/vendor-rating";
import { mockVendors } from "@/data/mock/vendors";
import { mockVendorAssessments } from "@/data/mock/vendor-assessments";
import { mockVendorPastWork } from "@/data/mock/vendor-past-work";

/**
 * Adapter boundary for the Vendor module. Components/hooks depend on this
 * interface, never on the concrete implementation below — swapping to a
 * real backend means adding `vendors-adapter.rest.ts` implementing the
 * same interface and changing the single export at the bottom of this
 * file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 7) for full detail:
 *   GET    /api/vendors                       — list, with computed averageRating/assessmentCount
 *   GET    /api/vendors/:id                    — detail
 *   POST   /api/vendors                        — create (admin, assigns vendorCode)
 *   PATCH  /api/vendors/:id                    — edit (admin, codeSeriesCategory immutable)
 *   GET    /api/vendors/:id/assessments        — assessment history
 *   POST   /api/vendors/:id/assessments        — add an assessment (admin)
 *   GET    /api/vendors/:id/past-work          — past work history
 *   POST   /api/vendors/:id/past-work          — add a past work entry (admin)
 */
export interface VendorActor {
  id: string;
  name: string;
}

export interface VendorListParams {
  search?: string;
  nature?: VendorNature;
  codeSeriesCategory?: VendorCodeSeriesCategory;
  gstCategory?: VendorGSTCategory;
  sortBy?: "tradeName" | "vendorCode" | "createdAt" | "averageRating";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/**
 * `averageRating`/`assessmentCount` are computed/joined fields, never
 * persisted on `Vendor` itself — a real backend would compute these via
 * an aggregate query over its assessments table, the same way this mock
 * computes them from `mockVendorAssessments` on every `list()` call.
 */
export interface VendorListItem extends Vendor {
  averageRating: number | null;
  assessmentCount: number;
}

export interface VendorListResult {
  items: VendorListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface VendorsAdapter {
  list(params?: VendorListParams): Promise<VendorListResult>;
  get(id: string): Promise<Vendor | null>;
  create(input: CreateVendorInput, actor: VendorActor): Promise<Vendor>;
  update(id: string, patch: UpdateVendorInput, actor: VendorActor): Promise<Vendor>;
  listAssessments(vendorId: string): Promise<VendorAssessment[]>;
  addAssessment(vendorId: string, input: CreateVendorAssessmentInput, actor: VendorActor): Promise<VendorAssessment>;
  listPastWork(vendorId: string): Promise<VendorPastWorkEntry[]>;
  addPastWork(vendorId: string, input: CreateVendorPastWorkInput, actor: VendorActor): Promise<VendorPastWorkEntry>;
}

class MockVendorsAdapter implements VendorsAdapter {
  private vendors: Vendor[] = [...mockVendors];
  private assessments: VendorAssessment[] = [...mockVendorAssessments];
  private pastWork: VendorPastWorkEntry[] = [...mockVendorPastWork];

  async list(params: VendorListParams = {}): Promise<VendorListResult> {
    await delay(300);
    let items: Vendor[] = [...this.vendors];

    if (params.nature) items = items.filter((v) => v.nature === params.nature);
    if (params.codeSeriesCategory) items = items.filter((v) => v.codeSeriesCategory === params.codeSeriesCategory);
    if (params.gstCategory) items = items.filter((v) => v.gstCategory === params.gstCategory);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter(
        (v) =>
          v.tradeName.toLowerCase().includes(q) ||
          v.vendorCode.toLowerCase().includes(q) ||
          v.contactPerson.toLowerCase().includes(q),
      );
    }

    const withRatings: VendorListItem[] = items.map((v) => {
      const vendorAssessments = this.assessments.filter((a) => a.vendorId === v.id);
      return { ...v, averageRating: computeAverageRating(vendorAssessments), assessmentCount: vendorAssessments.length };
    });

    const sortBy = params.sortBy ?? "createdAt";
    const sortDir = params.sortDir ?? "desc";
    withRatings.sort((a, b) => {
      const av = a[sortBy] ?? (sortBy === "averageRating" ? -1 : "");
      const bv = b[sortBy] ?? (sortBy === "averageRating" ? -1 : "");
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    const total = withRatings.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { items: withRatings.slice(start, start + pageSize), total, page, pageSize };
  }

  async get(id: string): Promise<Vendor | null> {
    await delay(200);
    return this.vendors.find((v) => v.id === id) ?? null;
  }

  async create(input: CreateVendorInput, _actor: VendorActor): Promise<Vendor> {
    await delay(500);
    const now = new Date().toISOString();
    const vendor: Vendor = {
      id: `vendor_${Math.random().toString(36).slice(2, 10)}`,
      vendorCode: assignVendorCode(input.codeSeriesCategory, this.vendors.map((v) => v.vendorCode)),
      tradeName: input.tradeName,
      gstCategory: input.gstCategory,
      gstin: input.gstin,
      address: input.address,
      msmeUdyamNumber: input.msmeUdyamNumber,
      contactPerson: input.contactPerson,
      contactPersonDesignation: input.contactPersonDesignation,
      email: input.email,
      contactNumber: input.contactNumber,
      nature: input.nature,
      codeSeriesCategory: input.codeSeriesCategory,
      turnover: input.turnover,
      createdAt: now,
      updatedAt: now,
    };
    this.vendors = [vendor, ...this.vendors];
    return vendor;
  }

  async update(id: string, patch: UpdateVendorInput, _actor: VendorActor): Promise<Vendor> {
    await delay(400);
    const vendor = this.mustFind(id);
    const updated: Vendor = { ...vendor, ...patch, updatedAt: new Date().toISOString() };
    this.replace(updated);
    return updated;
  }

  async listAssessments(vendorId: string): Promise<VendorAssessment[]> {
    await delay(250);
    return this.assessments.filter((a) => a.vendorId === vendorId).sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1));
  }

  async addAssessment(vendorId: string, input: CreateVendorAssessmentInput, actor: VendorActor): Promise<VendorAssessment> {
    await delay(400);
    this.mustFind(vendorId);
    const assessment: VendorAssessment = {
      id: `vassess_${Math.random().toString(36).slice(2, 10)}`,
      vendorId,
      quality: input.quality,
      timelineAdherence: input.timelineAdherence,
      futureBusinessProbability: input.futureBusinessProbability,
      presentCapacity: input.presentCapacity,
      notes: input.notes,
      assessedBy: actor.id,
      assessedByName: actor.name,
      assessedAt: new Date().toISOString(),
    };
    this.assessments = [assessment, ...this.assessments];
    return assessment;
  }

  async listPastWork(vendorId: string): Promise<VendorPastWorkEntry[]> {
    await delay(250);
    return this.pastWork.filter((p) => p.vendorId === vendorId).sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
  }

  async addPastWork(vendorId: string, input: CreateVendorPastWorkInput, _actor: VendorActor): Promise<VendorPastWorkEntry> {
    await delay(350);
    this.mustFind(vendorId);
    const entry: VendorPastWorkEntry = {
      id: `vpast_${Math.random().toString(36).slice(2, 10)}`,
      vendorId,
      projectId: input.projectId,
      description: input.description,
      value: input.value,
      completedAt: input.completedAt,
      createdAt: new Date().toISOString(),
    };
    this.pastWork = [entry, ...this.pastWork];
    return entry;
  }

  private mustFind(id: string): Vendor {
    const vendor = this.vendors.find((v) => v.id === id);
    if (!vendor) throw new Error("Vendor not found.");
    return vendor;
  }

  private replace(updated: Vendor) {
    this.vendors = this.vendors.map((v) => (v.id === updated.id ? updated : v));
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const vendorsAdapter: VendorsAdapter = new MockVendorsAdapter();

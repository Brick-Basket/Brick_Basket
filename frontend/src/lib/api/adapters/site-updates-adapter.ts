import type { CreateSiteUpdateInput, SiteUpdate, UpdateSiteUpdateInput } from "@/types/domain/site-update";
import { mockSiteUpdates } from "@/data/mock/site-updates";

/**
 * Adapter boundary for the Site Updates module — see
 * `src/types/domain/site-update.ts` for why this is its own module.
 * Follows the exact same shape as `documents-adapter.ts`: components/hooks
 * depend on this interface only; swapping to a real backend means adding
 * `site-updates-adapter.rest.ts` (minus `getPreviewUrl`, a mock-only
 * convenience) and changing the single export at the bottom of this file.
 *
 * Backend contract — proposed, see docs/API_CONTRACTS.md:
 *   GET    /api/site-updates                — list, filtered by project/date range; customer requests are always additionally filtered to visibleToCustomer=true server-side
 *   GET    /api/site-updates/:id             — detail
 *   POST   /api/site-updates                 — create (staff, multipart upload, multiple files)
 *   PATCH  /api/site-updates/:id             — edit remarks/visibility/date (staff) — media itself is not editable, see this file's `update`
 */
export interface SiteUpdateActor {
  id: string;
  name: string;
}

export interface SiteUpdateListParams {
  projectId?: string;
  /** Force-filters to only updates visible to a customer — the customer portal always sets this. */
  visibleToCustomer?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface SiteUpdateListResult {
  items: SiteUpdate[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SiteUpdatesAdapter {
  list(params?: SiteUpdateListParams): Promise<SiteUpdateListResult>;
  get(id: string): Promise<SiteUpdate | null>;
  /**
   * `files` are matched to `mediaMeta` by array position — every file the
   * poster attaches becomes one `SiteUpdateMedia` entry. Media is fixed at
   * creation: there's deliberately no "add more photos to an existing
   * update" action (see docs/OPEN_QUESTIONS.md) — post a new update instead,
   * which also keeps each update's date/remarks honestly tied to one visit.
   */
  create(input: CreateSiteUpdateInput, files: File[], mediaMeta: { type: "photo" | "video"; caption?: string }[], actor: SiteUpdateActor): Promise<SiteUpdate>;
  /** Metadata-only edit — remarks, date, related work item, visibility. Never touches `media`. */
  update(id: string, patch: UpdateSiteUpdateInput): Promise<SiteUpdate>;
  /**
   * Mock-only convenience: a synchronous, in-memory object URL for a media
   * item uploaded during this session (via the browser File API), or `null`
   * for every seeded demo record and after a page reload — there are no
   * real file bytes behind those. Never part of the real backend contract.
   */
  getPreviewUrl(mediaId: string): string | null;
}

class MockSiteUpdatesAdapter implements SiteUpdatesAdapter {
  private updates: SiteUpdate[] = [...mockSiteUpdates];
  private objectUrls = new Map<string, string>();

  async list(params: SiteUpdateListParams = {}): Promise<SiteUpdateListResult> {
    await delay(300);
    let items = [...this.updates];

    if (params.projectId) items = items.filter((u) => u.projectId === params.projectId);
    if (params.visibleToCustomer !== undefined) items = items.filter((u) => u.visibleToCustomer === params.visibleToCustomer);
    if (params.dateFrom) items = items.filter((u) => u.updateDate >= params.dateFrom!);
    if (params.dateTo) items = items.filter((u) => u.updateDate <= params.dateTo!);

    const sortDir = params.sortDir ?? "desc";
    items.sort((a, b) => {
      const cmp = a.updateDate < b.updateDate ? -1 : a.updateDate > b.updateDate ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  async get(id: string): Promise<SiteUpdate | null> {
    await delay(200);
    return this.updates.find((u) => u.id === id) ?? null;
  }

  async create(
    input: CreateSiteUpdateInput,
    files: File[],
    mediaMeta: { type: "photo" | "video"; caption?: string }[],
    actor: SiteUpdateActor,
  ): Promise<SiteUpdate> {
    await delay(600);
    const now = new Date().toISOString();

    const media = mediaMeta.map((meta, index) => {
      const file = files[index];
      const mediaId = `supdm_${Math.random().toString(36).slice(2, 10)}`;
      if (file) this.objectUrls.set(mediaId, URL.createObjectURL(file));
      return {
        id: mediaId,
        type: meta.type,
        fileName: file?.name ?? `update-media-${index + 1}`,
        fileType: file?.type || (meta.type === "video" ? "video/mp4" : "image/jpeg"),
        fileSizeBytes: file?.size ?? 0,
        caption: meta.caption,
      };
    });

    const update: SiteUpdate = {
      id: `supd_${Math.random().toString(36).slice(2, 10)}`,
      projectId: input.projectId,
      updateDate: input.updateDate,
      remarks: input.remarks,
      media,
      relatedWorkItem: input.relatedWorkItem,
      postedBy: actor.id,
      postedByName: actor.name,
      visibleToCustomer: input.visibleToCustomer,
      createdAt: now,
      updatedAt: now,
    };
    this.updates = [update, ...this.updates];
    return update;
  }

  async update(id: string, patch: UpdateSiteUpdateInput): Promise<SiteUpdate> {
    await delay(300);
    const existing = this.updates.find((u) => u.id === id);
    if (!existing) throw new Error("Site update not found.");
    const updated: SiteUpdate = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.updates = this.updates.map((u) => (u.id === id ? updated : u));
    return updated;
  }

  getPreviewUrl(mediaId: string): string | null {
    return this.objectUrls.get(mediaId) ?? null;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const siteUpdatesAdapter: SiteUpdatesAdapter = new MockSiteUpdatesAdapter();

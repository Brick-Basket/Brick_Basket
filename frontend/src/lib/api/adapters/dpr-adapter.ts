import type {
  CreateDPRInput,
  CreateDPRManpowerInput,
  CreateDPRWorkItemInput,
  DPR,
  DPRManpowerEntry,
  DPRWorkItemEntry,
  UpdateDPRInput,
} from "@/types/domain/dpr";
import { getDPRWorkItem } from "@/lib/constants/dpr-work-items";
import { mockDPRs, mockDPRManpowerEntries, mockDPRWorkItemEntries } from "@/data/mock/dpr";
import { scheduleAdapter, type ScheduleActor } from "@/lib/api/adapters/schedule-adapter";

/**
 * Adapter boundary for Daily Progress Report (Part 14).
 * Components/hooks depend on this interface, never on the concrete
 * implementation below — swapping to a real backend means adding
 * `dpr-adapter.rest.ts` implementing the same interface and changing the
 * single export at the bottom of this file.
 *
 * **Cross-adapter dependency, by design — the owner-required DPR → Schedule
 * Tracking link (§7C: "DPR is linked to schedule tracking so quantity ...
 * updates affect progress and delays").** `create`/`update` below call
 * `scheduleAdapter`'s own methods (`get`/`listProgress`/`addProgress`),
 * never its mock arrays directly — the same pattern every other
 * cross-module adapter in this app uses (GRN→PO, MRC→GRN/Customers,
 * e.g.). For every submitted work-item line that carries a
 * `scheduleActivityId`, the pushed figure is
 * **`(that ScheduleActivity's own latest ScheduleProgressEntry.executedQuantity) + this line's todayQty`**
 * — deliberately *not* this DPR's own computed cumulative for that work
 * item. That avoids a regression: if an activity already had independent
 * Schedule progress before anyone linked a DPR line to it, the first
 * linked DPR submission adds to that existing figure rather than
 * overwriting it with a DPR-only history that starts from zero.
 * **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #35.
 *
 * **Phase 4 fix (post-Part-20 stabilization pass, resolving
 * `docs/OPEN_QUESTIONS.md` #35e)**: editing an already-submitted,
 * Schedule-linked DPR line used to append *another* auto-recorded progress
 * entry every time rather than correcting the earlier one — silently
 * double- (or triple-, or...) counting that line's contribution to the
 * activity's cumulative executed quantity on every re-edit. Fixed via
 * `scheduleAdapter.upsertProgressFromSource`: each linked line computes a
 * stable key (`buildDprScheduleSourceKey`, below — `${dprId}:${workItemMasterId}:${location ?? ""}`,
 * stable across edits even though `DPRWorkItemEntry.id` itself is
 * regenerated on every `update`, see below) and the pushed entry is
 * corrected in place on later edits instead of duplicated. The baseline
 * this line adds `todayQty` on top of is also now computed excluding any
 * entry already attributed to this same key, so re-saving a DPR without
 * changing `todayQty` no longer compounds the cumulative figure on every
 * save.
 *
 * **Reconciliation fix (BrickBasket final hardening pass)**: the four edge
 * cases the Phase 4 fix above left as known, flagged gaps — (1) a linked
 * line deleted from the DPR on a later edit, (2) its `scheduleActivityId`
 * repointed at a different activity, (3) its `workItemMasterId` changed,
 * (4) its `location` changed (any of (2)-(4) changes the line's stable
 * source key or its target activity, or both) — are now handled, not just
 * documented. `update()` below captures every *old* linked line's
 * `(scheduleActivityId, sourceKey)` pairing before rebuilding this DPR's
 * lines, computes the *new* set of pairings after rebuilding, and calls
 * `scheduleAdapter.removeProgressBySource` for every old pairing that
 * doesn't survive into the new set — cleaning up the orphaned entry on
 * whichever activity it was previously pushed to, before the new set (if
 * any) is pushed via `upsertProgressFromSource` as before. This is a
 * narrow, additive extension to the Schedule ledger's append-only design
 * (a new `removeProgressBySource` method, mirroring `upsertProgressFromSource`)
 * — it can only ever remove an entry that carries a matching `source.type`/
 * `source.key`, so a manually-typed entry (no `source`) remains completely
 * untouched and strictly append-only, exactly as before this fix. See
 * `docs/OPEN_QUESTIONS.md` and `docs/WORKFLOWS.md` for the corresponding
 * backend-transaction contract this reconciliation implies for a real
 * `PATCH /api/dprs/:id`.
 *
 * This module's own "previous qty"/"cumulative qty"/"% complete" columns
 * (§7C's work-item table) are a separate, DPR-only ledger — computed at
 * render time from every earlier `DPRWorkItemEntry` for the same work item
 * in the same project (see `listWorkItemHistory` below and
 * `src/components/dpr/dpr-work-item-math.ts`), never backfilled from
 * whatever a linked `ScheduleActivity` already shows.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 14) for full detail:
 *   GET    /api/dprs                    — list, filtered by project/date range
 *   GET    /api/dprs/:id                 — detail
 *   GET    /api/dprs/:id/manpower         — this DPR's manpower rows
 *   GET    /api/dprs/:id/work-items        — this DPR's work-item lines
 *   GET    /api/dprs/work-item-history      — every work-item line for a project, across every DPR (dpr:read)
 *   POST   /api/dprs                    — create (dpr:write)
 *   PATCH  /api/dprs/:id                 — edit (dpr:write)
 */
export interface DPRActor {
  id: string;
  name: string;
}

export interface DPRListParams {
  search?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "reportDate" | "createdAt" | "dprNumber";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface DPRListResult {
  items: DPR[];
  total: number;
  page: number;
  pageSize: number;
}

/** One work-item line paired with the `DPR` it belongs to — what `listWorkItemHistory` returns. */
export interface DPRWorkItemHistoryEntry {
  dpr: DPR;
  line: DPRWorkItemEntry;
}

export interface DPRAdapter {
  list(params?: DPRListParams): Promise<DPRListResult>;
  get(id: string): Promise<DPR | null>;
  listManpowerEntries(dprId: string): Promise<DPRManpowerEntry[]>;
  listWorkItemLines(dprId: string): Promise<DPRWorkItemEntry[]>;
  /** Every work-item line across every DPR for one project, oldest first — backs the "previous/cumulative/% complete" computation and the create/edit form's per-line defaults. */
  listWorkItemHistory(projectId: string): Promise<DPRWorkItemHistoryEntry[]>;
  create(input: CreateDPRInput, actor: DPRActor): Promise<DPR>;
  update(id: string, patch: UpdateDPRInput, actor: DPRActor): Promise<DPR>;
}

/**
 * In-memory mock implementation. Simulates network latency so loading
 * states are exercised before a real API exists. Data does not persist
 * across a full page reload — demo behavior, not backend persistence.
 */
class MockDPRAdapter implements DPRAdapter {
  private dprs: DPR[] = [...mockDPRs];
  private manpowerEntries: DPRManpowerEntry[] = [...mockDPRManpowerEntries];
  private workItemLines: DPRWorkItemEntry[] = [...mockDPRWorkItemEntries];

  async list(params: DPRListParams = {}): Promise<DPRListResult> {
    await delay(300);
    let items = [...this.dprs];

    if (params.projectId) items = items.filter((d) => d.projectId === params.projectId);
    if (params.dateFrom) items = items.filter((d) => d.reportDate >= params.dateFrom!);
    if (params.dateTo) items = items.filter((d) => d.reportDate <= params.dateTo!);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((d) => d.dprNumber.toLowerCase().includes(q));
    }

    const sortBy = params.sortBy ?? "reportDate";
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

  async get(id: string): Promise<DPR | null> {
    await delay(200);
    return this.dprs.find((d) => d.id === id) ?? null;
  }

  async listManpowerEntries(dprId: string): Promise<DPRManpowerEntry[]> {
    await delay(200);
    return this.manpowerEntries.filter((m) => m.dprId === dprId);
  }

  async listWorkItemLines(dprId: string): Promise<DPRWorkItemEntry[]> {
    await delay(200);
    return this.workItemLines.filter((w) => w.dprId === dprId);
  }

  async listWorkItemHistory(projectId: string): Promise<DPRWorkItemHistoryEntry[]> {
    await delay(250);
    const projectDprs = this.dprs.filter((d) => d.projectId === projectId);
    const dprIds = new Set(projectDprs.map((d) => d.id));
    const dprsById = new Map(projectDprs.map((d) => [d.id, d]));
    const paired = this.workItemLines
      .filter((line) => dprIds.has(line.dprId))
      .map((line) => ({ dpr: dprsById.get(line.dprId)!, line }));
    paired.sort((a, b) => {
      if (a.dpr.reportDate !== b.dpr.reportDate) return a.dpr.reportDate < b.dpr.reportDate ? -1 : 1;
      return a.line.createdAt < b.line.createdAt ? -1 : 1;
    });
    return paired;
  }

  async create(input: CreateDPRInput, actor: DPRActor): Promise<DPR> {
    await delay(500);
    this.assertValidWorkItems(input.workItems);

    const now = new Date().toISOString();
    const dpr: DPR = {
      id: `dpr_${Math.random().toString(36).slice(2, 10)}`,
      projectId: input.projectId,
      dprNumber: `DPR-${String(this.dprs.length + 1).padStart(4, "0")}`,
      reportDate: input.reportDate,
      preparedBy: actor.id,
      preparedByName: actor.name,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.dprs = [dpr, ...this.dprs];
    this.manpowerEntries = [...this.manpowerEntries, ...this.buildManpowerEntries(dpr.id, input.manpower)];
    const workItemLines = this.buildWorkItemLines(dpr.id, input.workItems);
    this.workItemLines = [...this.workItemLines, ...workItemLines];

    await this.pushScheduleUpdates(dpr, workItemLines, actor);

    return dpr;
  }

  async update(id: string, patch: UpdateDPRInput, actor: DPRActor): Promise<DPR> {
    await delay(450);
    const dpr = this.mustFind(id);

    const updated: DPR = {
      ...dpr,
      ...(patch.reportDate !== undefined ? { reportDate: patch.reportDate } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.dprs = this.dprs.map((d) => (d.id === id ? updated : d));

    if (patch.manpower) {
      this.manpowerEntries = this.manpowerEntries.filter((m) => m.dprId !== id);
      this.manpowerEntries = [...this.manpowerEntries, ...this.buildManpowerEntries(id, patch.manpower)];
    }

    if (patch.workItems) {
      this.assertValidWorkItems(patch.workItems);

      // BrickBasket final hardening pass — reconcile DPR-owned Schedule
      // contributions before rebuilding this DPR's lines, not just push the
      // new set. Capture every *old* linked line's (activityId, sourceKey)
      // pairing first: a line can stop being "the same contribution" in
      // three ways on this edit — it's removed entirely, its
      // `scheduleActivityId` is repointed at a different activity, or its
      // `workItemMasterId`/`location` changes (either of which changes
      // `buildDprScheduleSourceKey`'s output even if the activity stays the
      // same). In every one of those cases the *old* pairing's previously-
      // pushed progress entry must be removed, not left behind as an
      // orphan still counting toward that activity's cumulative progress —
      // see `docs/OPEN_QUESTIONS.md` and `docs/WORKFLOWS.md`.
      const oldLines = this.workItemLines.filter((w) => w.dprId === id);
      const oldLinkedPairs = oldLines
        .filter((l): l is DPRWorkItemEntry & { scheduleActivityId: string } => !!l.scheduleActivityId)
        .map((l) => ({
          activityId: l.scheduleActivityId,
          sourceKey: buildDprScheduleSourceKey(id, l.workItemMasterId, l.location),
        }));

      this.workItemLines = this.workItemLines.filter((w) => w.dprId !== id);
      const newLines = this.buildWorkItemLines(id, patch.workItems);
      this.workItemLines = [...this.workItemLines, ...newLines];

      const newLinkedPairKeys = new Set(
        newLines
          .filter((l): l is DPRWorkItemEntry & { scheduleActivityId: string } => !!l.scheduleActivityId)
          .map((l) => `${l.scheduleActivityId}::${buildDprScheduleSourceKey(id, l.workItemMasterId, l.location)}`),
      );

      for (const pair of oldLinkedPairs) {
        const key = `${pair.activityId}::${pair.sourceKey}`;
        if (newLinkedPairKeys.has(key)) continue; // still the same contribution — pushScheduleUpdates below will correct it in place
        await scheduleAdapter.removeProgressBySource(pair.activityId, "dpr", pair.sourceKey);
      }

      // Re-pushes to Schedule for every linked line in the new set — see
      // this file's header comment on why a correction updates the
      // existing entry in place (via `upsertProgressFromSource`) rather
      // than appending a fresh one.
      await this.pushScheduleUpdates(updated, newLines, actor);
    }

    return updated;
  }

  private assertValidWorkItems(items: CreateDPRWorkItemInput[]): void {
    for (const item of items) {
      if (!getDPRWorkItem(item.workItemMasterId)) {
        throw new Error("One of the selected work items is not recognized.");
      }
    }
  }

  private buildManpowerEntries(dprId: string, inputs: CreateDPRManpowerInput[]): DPRManpowerEntry[] {
    const now = new Date().toISOString();
    return inputs.map((m) => ({
      id: `dpr_mp_${Math.random().toString(36).slice(2, 10)}`,
      dprId,
      category: m.category,
      skilled: m.skilled,
      unskilled: m.unskilled,
      agency: m.agency,
      createdAt: now,
    }));
  }

  private buildWorkItemLines(dprId: string, inputs: CreateDPRWorkItemInput[]): DPRWorkItemEntry[] {
    const now = new Date().toISOString();
    return inputs.map((w) => ({
      id: `dpr_wi_${Math.random().toString(36).slice(2, 10)}`,
      dprId,
      workItemMasterId: w.workItemMasterId,
      otherDescription: w.otherDescription,
      otherUom: w.otherUom,
      location: w.location,
      plannedQty: w.plannedQty,
      todayQty: w.todayQty,
      remarks: w.remarks,
      scheduleActivityId: w.scheduleActivityId ?? null,
      createdAt: now,
    }));
  }

  /** See this file's header comment for exactly what gets pushed and why. */
  private async pushScheduleUpdates(dpr: DPR, lines: DPRWorkItemEntry[], actor: DPRActor): Promise<void> {
    const scheduleActor: ScheduleActor = actor;
    const linkedLines = lines.filter((l): l is DPRWorkItemEntry & { scheduleActivityId: string } => !!l.scheduleActivityId);

    for (const line of linkedLines) {
      const activity = await scheduleAdapter.get(line.scheduleActivityId);
      // A stale or cross-project link is skipped rather than failing the
      // whole DPR submission — the work-item line itself still saves.
      if (!activity || activity.projectId !== dpr.projectId) continue;

      const sourceKey = buildDprScheduleSourceKey(dpr.id, line.workItemMasterId, line.location);
      const existingProgress = await scheduleAdapter.listProgress(line.scheduleActivityId);
      // Baseline excludes this same line's own previously-pushed entry (if
      // any) — otherwise re-saving the DPR without changing `todayQty`
      // would keep adding it on top of itself on every edit.
      const baselineCandidates = existingProgress.filter(
        (p) => !(p.source?.type === "dpr" && p.source.key === sourceKey),
      );
      const latestExecuted =
        baselineCandidates.length === 0
          ? 0
          : [...baselineCandidates].sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1))[0]!.executedQuantity;
      const cumulative = latestExecuted + line.todayQty;

      await scheduleAdapter.upsertProgressFromSource(
        line.scheduleActivityId,
        "dpr",
        sourceKey,
        {
          recordedAt: dpr.reportDate,
          executedQuantity: cumulative,
          remarks: `Auto-recorded from DPR ${dpr.dprNumber} (+${line.todayQty} ${activity.uom} today)`,
        },
        scheduleActor,
      );
    }
  }

  private mustFind(id: string): DPR {
    const dpr = this.dprs.find((d) => d.id === id);
    if (!dpr) throw new Error("DPR not found.");
    return dpr;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stable identity for a DPR work-item line's Schedule-progress push,
 * usable as `ScheduleProgressEntry.source.key` — see the header comment
 * above. Deliberately **not** `DPRWorkItemEntry.id`: `update()` deletes and
 * rebuilds every work-item line with a fresh random id on every edit (see
 * `buildWorkItemLines`), so the row's own id can't identify "the same
 * line" across edits. `workItemMasterId` + `location` is what a person
 * actually means by "the same line" when editing a DPR — two lines for the
 * same work item at different locations get different keys, correctly
 * treated as separate Schedule contributions.
 */
function buildDprScheduleSourceKey(dprId: string, workItemMasterId: string, location: string | undefined): string {
  return `${dprId}:${workItemMasterId}:${location ?? ""}`;
}

export const dprAdapter: DPRAdapter = new MockDPRAdapter();

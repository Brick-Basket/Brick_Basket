import type {
  CreateScheduleActivityInput,
  CreateScheduleProgressInput,
  ScheduleActivity,
  ScheduleProgressEntry,
  UpdateScheduleActivityInput,
} from "@/types/domain/project-schedule";
import { mockScheduleActivities } from "@/data/mock/schedule-activities";
import { mockScheduleProgress } from "@/data/mock/schedule-progress";
import { validateMonthlyPlan } from "@/components/schedule/schedule-monthly-plan-math";

/**
 * Adapter boundary for Project Schedule + Tracking (Part 13).
 * Components/hooks depend on this interface, never on the concrete
 * implementation below — swapping to a real backend means adding
 * `schedule-adapter.rest.ts` implementing the same interface and changing
 * the single export at the bottom of this file.
 *
 * Backend contract — see docs/API_CONTRACTS.md (Part 13, extended Phase 3) for full detail:
 *   GET    /api/schedule-activities                 — list, filtered by project
 *   GET    /api/schedule-activities/:id               — detail
 *   POST   /api/schedule-activities                  — create (schedule:write)
 *   PATCH  /api/schedule-activities/:id                — edit (schedule:write)
 *   GET    /api/schedule-activities/:id/progress        — this activity's progress log
 *   GET    /api/schedule-activities/progress-summary?activityIds=a,b,c — bulk progress for several activities in one call (Phase 3 — replaces N calls to the endpoint above)
 *   POST   /api/schedule-activities/:id/progress        — record a new cumulative progress reading (schedule:write)
 */
export interface ScheduleActor {
  id: string;
  name: string;
}

export interface ScheduleListParams {
  search?: string;
  projectId?: string;
  sortBy?: "sequence" | "plannedStart" | "plannedEnd" | "activity" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface ScheduleListResult {
  items: ScheduleActivity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ScheduleAdapter {
  list(params?: ScheduleListParams): Promise<ScheduleListResult>;
  get(id: string): Promise<ScheduleActivity | null>;
  create(input: CreateScheduleActivityInput, actor: ScheduleActor): Promise<ScheduleActivity>;
  update(id: string, patch: UpdateScheduleActivityInput, actor: ScheduleActor): Promise<ScheduleActivity>;
  listProgress(activityId: string): Promise<ScheduleProgressEntry[]>;
  /**
   * Bulk equivalent of calling `listProgress` once per id — added in the
   * post-Part-20 stabilization pass (Phase 3) after finding
   * `useScheduleProgressMap` issued one `listProgress` request per visible
   * activity via `Promise.all`. Against this in-memory mock that's harmless,
   * but it's a genuine N+1 pattern that would cost N real HTTP round-trips
   * against a backend for a schedule page that can easily show 15-20
   * activities (and their Gantt bars) at once. Returns exactly the grouping
   * a caller would get from N individual `listProgress` calls — same
   * per-activity sort (newest `recordedAt` first), computed in one pass —
   * so no downstream consumer (`ScheduleTable`, `ScheduleGanttChart`) needed
   * to change.
   */
  listProgressForActivities(activityIds: string[]): Promise<Map<string, ScheduleProgressEntry[]>>;
  addProgress(activityId: string, input: CreateScheduleProgressInput, actor: ScheduleActor): Promise<ScheduleProgressEntry>;
  /**
   * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass,
   * Phase 4, resolving `docs/OPEN_QUESTIONS.md` #35e): if this activity
   * already has a progress entry whose `source.type`/`source.key` match,
   * that entry is corrected in place (same `id`) instead of a duplicate
   * being appended — used by DPR (Part 14) so re-editing a DPR line
   * already linked to this activity updates its one contribution rather
   * than piling up another auto-recorded entry every time. Every entry
   * with no `source` (typed in directly on this screen) is untouched by
   * this method and stays append-only, as before.
   */
  upsertProgressFromSource(
    activityId: string,
    sourceType: "dpr",
    sourceKey: string,
    input: CreateScheduleProgressInput,
    actor: ScheduleActor,
  ): Promise<ScheduleProgressEntry>;
  /**
   * BrickBasket final hardening pass — the reconciliation counterpart to
   * `upsertProgressFromSource` above. Removes the one progress entry (if
   * any) whose `source.type`/`source.key` match on this specific activity —
   * a no-op if none exists. Used by DPR (Part 14) when a previously-linked
   * work-item line is deleted from a DPR on a later edit, or is re-pointed
   * at a different `scheduleActivityId`/`workItemMasterId`/`location` (any
   * of which changes the line's stable source key or its target activity) —
   * in every such case, the entry the *old* line/activity pairing
   * previously pushed must not be left behind as an orphan still counting
   * toward that activity's cumulative progress. **Only ever touches an
   * entry that carries this exact `source` match** — a manually-typed
   * entry (no `source` at all) can never be matched or removed by this
   * method, preserving the append-only guarantee for every entry a human
   * typed in directly. See `docs/OPEN_QUESTIONS.md` and
   * `docs/WORKFLOWS.md`'s DPR section for the full reconciliation contract
   * a real backend must implement transactionally alongside `PATCH /api/dprs/:id`.
   */
  removeProgressBySource(activityId: string, sourceType: "dpr", sourceKey: string): Promise<void>;
}

/**
 * In-memory mock implementation. Simulates network latency so loading
 * states are exercised before a real API exists. Data does not persist
 * across a full page reload — demo behavior, not backend persistence.
 */
class MockScheduleAdapter implements ScheduleAdapter {
  private activities: ScheduleActivity[] = [...mockScheduleActivities];
  private progress: ScheduleProgressEntry[] = [...mockScheduleProgress];

  async list(params: ScheduleListParams = {}): Promise<ScheduleListResult> {
    await delay(300);
    let items = [...this.activities];

    if (params.projectId) items = items.filter((a) => a.projectId === params.projectId);
    if (params.search) {
      const q = params.search.trim().toLowerCase();
      items = items.filter((a) => a.activity.toLowerCase().includes(q));
    }

    // Default sort is `sequence` ascending, not `createdAt` descending like
    // every other module's list — a Gantt/schedule table reads naturally in
    // planned/display order, not "newest edited first."
    const sortBy = params.sortBy ?? "sequence";
    const sortDir = params.sortDir ?? "asc";
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

  async get(id: string): Promise<ScheduleActivity | null> {
    await delay(200);
    return this.activities.find((a) => a.id === id) ?? null;
  }

  async create(input: CreateScheduleActivityInput, _actor: ScheduleActor): Promise<ScheduleActivity> {
    await delay(400);
    const monthlyPlan = input.monthlyPlan ?? [];
    const monthlyPlanError = validateMonthlyPlan(input.quantity, monthlyPlan);
    if (monthlyPlanError) throw new Error(monthlyPlanError);

    const now = new Date().toISOString();
    const sequence = input.sequence ?? this.nextSequence(input.projectId);
    const activity: ScheduleActivity = {
      id: `sched_${Math.random().toString(36).slice(2, 10)}`,
      projectId: input.projectId,
      activity: input.activity,
      uom: input.uom,
      quantity: input.quantity,
      plannedStart: input.plannedStart,
      plannedEnd: input.plannedEnd,
      sequence,
      monthlyPlan,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };
    this.activities = [...this.activities, activity];
    return activity;
  }

  async update(id: string, patch: UpdateScheduleActivityInput, _actor: ScheduleActor): Promise<ScheduleActivity> {
    await delay(350);
    const activity = this.mustFind(id);
    const updated: ScheduleActivity = { ...activity, ...patch, updatedAt: new Date().toISOString() };
    // Re-validated against whichever ends up being the effective
    // quantity/monthlyPlan pair after the patch is applied — a patch might
    // change either one independently (editing just the total quantity
    // while leaving an existing monthly breakdown in place is exactly the
    // case that must be caught here).
    const monthlyPlanError = validateMonthlyPlan(updated.quantity, updated.monthlyPlan);
    if (monthlyPlanError) throw new Error(monthlyPlanError);
    this.activities = this.activities.map((a) => (a.id === id ? updated : a));
    return updated;
  }

  async listProgress(activityId: string): Promise<ScheduleProgressEntry[]> {
    await delay(200);
    return this.progress
      .filter((p) => p.activityId === activityId)
      .sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
  }

  async listProgressForActivities(activityIds: string[]): Promise<Map<string, ScheduleProgressEntry[]>> {
    await delay(250); // one simulated round trip total, not one per activity
    const idSet = new Set(activityIds);
    const map = new Map<string, ScheduleProgressEntry[]>();
    for (const id of activityIds) map.set(id, []);
    for (const entry of this.progress) {
      if (!idSet.has(entry.activityId)) continue;
      map.get(entry.activityId)!.push(entry);
    }
    for (const [id, entries] of map) {
      map.set(
        id,
        [...entries].sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1)),
      );
    }
    return map;
  }

  async addProgress(activityId: string, input: CreateScheduleProgressInput, actor: ScheduleActor): Promise<ScheduleProgressEntry> {
    await delay(400);
    this.mustFind(activityId);
    if (input.executedQuantity < 0) throw new Error("Executed quantity can't be negative.");
    const entry: ScheduleProgressEntry = {
      id: `prog_${Math.random().toString(36).slice(2, 10)}`,
      activityId,
      recordedAt: input.recordedAt,
      executedQuantity: input.executedQuantity,
      recordedBy: actor.id,
      recordedByName: actor.name,
      remarks: input.remarks,
      createdAt: new Date().toISOString(),
    };
    this.progress = [...this.progress, entry];
    return entry;
  }

  async upsertProgressFromSource(
    activityId: string,
    sourceType: "dpr",
    sourceKey: string,
    input: CreateScheduleProgressInput,
    actor: ScheduleActor,
  ): Promise<ScheduleProgressEntry> {
    await delay(400);
    this.mustFind(activityId);
    if (input.executedQuantity < 0) throw new Error("Executed quantity can't be negative.");

    const existing = this.progress.find(
      (p) => p.activityId === activityId && p.source?.type === sourceType && p.source.key === sourceKey,
    );

    if (existing) {
      const updated: ScheduleProgressEntry = {
        ...existing,
        recordedAt: input.recordedAt,
        executedQuantity: input.executedQuantity,
        remarks: input.remarks,
        recordedBy: actor.id,
        recordedByName: actor.name,
      };
      this.progress = this.progress.map((p) => (p.id === existing.id ? updated : p));
      return updated;
    }

    const created: ScheduleProgressEntry = {
      id: `prog_${Math.random().toString(36).slice(2, 10)}`,
      activityId,
      recordedAt: input.recordedAt,
      executedQuantity: input.executedQuantity,
      recordedBy: actor.id,
      recordedByName: actor.name,
      remarks: input.remarks,
      createdAt: new Date().toISOString(),
      source: { type: sourceType, key: sourceKey },
    };
    this.progress = [...this.progress, created];
    return created;
  }

  async removeProgressBySource(activityId: string, sourceType: "dpr", sourceKey: string): Promise<void> {
    await delay(200);
    // Filters out at most one entry — `source.key` is constructed to be
    // unique per (activity, source) pairing by upsertProgressFromSource's
    // own caller. Entries with no `source` at all can never match this
    // filter's `p.source?.type === sourceType` check, so a manually-typed
    // entry is structurally unreachable here.
    this.progress = this.progress.filter(
      (p) => !(p.activityId === activityId && p.source?.type === sourceType && p.source.key === sourceKey),
    );
  }

  private nextSequence(projectId: string): number {
    const existing = this.activities.filter((a) => a.projectId === projectId);
    return existing.length === 0 ? 1 : Math.max(...existing.map((a) => a.sequence)) + 1;
  }

  private mustFind(id: string): ScheduleActivity {
    const activity = this.activities.find((a) => a.id === id);
    if (!activity) throw new Error("Schedule activity not found.");
    return activity;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const scheduleAdapter: ScheduleAdapter = new MockScheduleAdapter();

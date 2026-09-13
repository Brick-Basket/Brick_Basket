/**
 * Daily Progress Report (Part 14) — the owner-required daily manpower +
 * work-item capture that a Project Manager/Execution Engineer files per
 * project per day, linked to Project Schedule + Tracking (Part 13) so
 * quantity updates here can move an activity's progress/delay there too.
 *
 * Source module: Daily Progress Report (Part 14), scoped to a `Project` by
 * `projectId`. Depends on Project Schedule + Tracking (Part 13) for the
 * optional `scheduleActivityId` link on a work-item line, and on the
 * static work-item master list in `src/lib/constants/dpr-work-items.ts`
 * for `workItemMasterId`. Backend ownership: persistence, numbering, and
 * (once real) enforcing at most one DPR per project per day are
 * backend-owned — this build does not enforce that uniqueness, matching
 * the app's general looseness elsewhere (e.g. GRN allows more than one
 * receipt against the same PO). See `docs/OPEN_QUESTIONS.md`.
 */
export interface DPR {
  id: string;
  projectId: string;
  /** Backend-assigned display reference, e.g. "DPR-0007". */
  dprNumber: string;
  /** ISO date (day precision) — the day this report covers. */
  reportDate: string;
  preparedBy: string;
  preparedByName: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateDPRInput = {
  projectId: string;
  reportDate: string;
  notes?: string;
  manpower: CreateDPRManpowerInput[];
  workItems: CreateDPRWorkItemInput[];
};

/** `projectId` is immutable after creation, matching every other module's project-scoped entity. */
export type UpdateDPRInput = Partial<Omit<CreateDPRInput, "projectId">>;

/**
 * Owner-confirmed, fixed 8-value manpower category list (§7C) — not a
 * configurable union the way, say, `Lead.status` is; every DPR carries
 * exactly one row per category (zero-filled when a category wasn't used
 * that day), never a dynamic add/remove list.
 */
export type DPRManpowerCategory =
  | "civil_mason"
  | "carpenter"
  | "bar_bender"
  | "plumber"
  | "electrician"
  | "painter"
  | "tile_masonry_finishing"
  | "other";

/**
 * One manpower category's headcount for a `DPR`. `total` (owner-named
 * column) is always computed as `skilled + unskilled` at render time,
 * never stored, per the field typing conventions in `docs/DATA_MODELS.md`.
 */
export interface DPRManpowerEntry {
  id: string;
  dprId: string;
  category: DPRManpowerCategory;
  skilled: number;
  unskilled: number;
  /** Free text — the labor contractor/agency supplying this category, per the owner's "Agency" column. */
  agency?: string;
  createdAt: string;
}

export type CreateDPRManpowerInput = {
  category: DPRManpowerCategory;
  skilled: number;
  unskilled: number;
  agency?: string;
};

/**
 * One work-item line on a `DPR` — one row of the owner-required
 * "Sl. No. / Work Item / Location / Unit / Planned / Previous / Today's /
 * Cumulative / % Complete / Remarks" table. `workItemMasterId` points at
 * the static, configurable master list (`src/lib/constants/dpr-work-items.ts`)
 * covering the owner's full Civil (23) / Electrical (15) / Plumbing &
 * Sanitary (18) / Finishing (21) item lists.
 *
 * `todayQty` is an **incremental** delta — how much was executed *today* —
 * a deliberate departure from `ScheduleProgressEntry.executedQuantity`'s
 * cumulative-as-of-date model (Part 13): the owner's DPR table names
 * "Today's Qty." and "Cumulative Qty." as two separate columns, so this
 * build takes "today's" literally and computes "previous"/"cumulative"/
 * "% complete" at render time from the full history of this work item's
 * lines across every earlier `DPR` in the same project — never stored.
 * **FRONTEND IMPLEMENTATION DECISION**, see `docs/OPEN_QUESTIONS.md` #35.
 */
export interface DPRWorkItemEntry {
  id: string;
  dprId: string;
  workItemMasterId: string;
  /** Only meaningful when `workItemMasterId` resolves to one of the four "Other ___ work" catch-all master rows. */
  otherDescription?: string;
  /** Only meaningful for the same catch-all rows — the master list leaves their unit unspecified, so it's free text here instead of the disabled, master-derived UOM every other row gets. */
  otherUom?: string;
  location?: string;
  /** The planned total quantity for this work item on this project — re-entered/edited per line, not derived from anywhere else (no owner-confirmed link to a single authoritative planned figure). */
  plannedQty: number;
  todayQty: number;
  remarks?: string;
  /**
   * Optional DPR → Schedule Tracking link (§7C's "DPR is linked to
   * schedule tracking so quantity ... updates affect progress and
   * delays"). When set, submitting this line also records a
   * `ScheduleProgressEntry` on that `ScheduleActivity` — see
   * `dpr-adapter.ts`'s header comment for exactly how.
   */
  scheduleActivityId?: string | null;
  createdAt: string;
}

export type CreateDPRWorkItemInput = {
  workItemMasterId: string;
  otherDescription?: string;
  otherUom?: string;
  location?: string;
  plannedQty: number;
  todayQty: number;
  remarks?: string;
  scheduleActivityId?: string | null;
};

/** The four owner-named work categories a master item belongs to. */
export type DPRWorkCategory = "civil" | "electrical" | "plumbing_sanitary" | "finishing";

/**
 * One row of the static, owner-specified master work-item list — not an
 * adapter-backed entity (no create/edit UI; "configurable" per the owner
 * text means centralized in one file, the same treatment `StockMaterial`
 * got in Part 11, not a mutable database table in this build). Lives in
 * `src/lib/constants/dpr-work-items.ts`.
 */
export interface DPRWorkItemMaster {
  id: string;
  category: DPRWorkCategory;
  /** The owner list's own item number within its category (1–23 Civil, 1–15 Electrical, 1–18 Plumbing & Sanitary, 1–21 Finishing). */
  slNo: number;
  description: string;
  /** Empty string for the four "Other ___ work" catch-all rows, whose unit the owner list leaves unspecified — the UOM field is left editable for those rows instead of disabled. */
  uom: string;
  /** True only for the one "Other ___ work" catch-all row per category. */
  isOtherCatchAll: boolean;
}

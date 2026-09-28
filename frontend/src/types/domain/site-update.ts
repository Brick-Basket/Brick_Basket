/**
 * Daily site-progress media update — geo-tagged-photo/video style updates
 * a site engineer or project manager posts from the field, visible to the
 * customer in their portal so they can follow construction without a site
 * visit. Requested directly: "there must be a feature in which daily photo
 * and video upload option must be there... it's a very important feature."
 *
 * FRONTEND IMPLEMENTATION DECISION — this is a new module, not covered by
 * name in the owner's original requirements or `docs/BrickBasket_Master_
 * Frontend_Prompt_v6.1`. It's built as its own entity rather than folded
 * into either existing candidate:
 *   - **Not** a `Document` (`document.ts`): `DocumentCategory` is an
 *     owner-confirmed, non-configurable 6-value union (finalized drawings,
 *     layouts, certificates, warranty items) — adding a 7th category for a
 *     rolling daily photo feed would mean silently overriding a value the
 *     owner explicitly confirmed as fixed. See `docs/FILE_UPLOADS.md`.
 *   - **Not** folded into `DPR` (`dpr.ts`): DPR's manpower/work-item data is
 *     dense internal operations data with no customer-facing surface
 *     anywhere in this app today: exposing it wholesale would mean the
 *     customer suddenly sees raw quantity/manpower tables, which is a much
 *     bigger, unconfirmed scope change than "let the customer see photos."
 * A `SiteUpdate` can optionally reference the `ScheduleActivity`/`DPR` it
 * corresponds to (`relatedWorkItem`, free text — no confirmed link exists
 * between this module and Schedule/DPR's own IDs) but has its own simple
 * lifecycle: posted by staff, immediately visible (or held back) to the
 * customer, never a workflow/approval chain.
 *
 * See `docs/OPEN_QUESTIONS.md` for every frontend decision this module
 * made without owner confirmation — most importantly: no geolocation/GPS
 * coordinates are captured or displayed anywhere. The reference site this
 * feature was modeled after called its version "geo-tagged," but this
 * frontend has no location API, no map, and no owner-confirmed requirement
 * to fabricate coordinates, so nothing here claims to be geo-tagged.
 */
export type SiteUpdateMediaType = "photo" | "video";

export interface SiteUpdateMedia {
  id: string;
  type: SiteUpdateMediaType;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  /** Optional short label for this specific photo/video, e.g. "Foundation, east wall". */
  caption?: string;
}

export interface SiteUpdate {
  id: string;
  projectId: string;
  /** The calendar day this update covers — ISO date, not a timestamp (matches `StockEntry.date`/`DPR.reportDate`'s convention). */
  updateDate: string;
  /** Plain-language remark from the field, e.g. "Excavation complete to design depth." Required — a photo with zero context isn't useful on its own. */
  remarks: string;
  /** Fixed at creation — see this file's header comment on why there's no "add more photos to an existing update" action. */
  media: SiteUpdateMedia[];
  /** Optional free-text pointer to what this update relates to (e.g. "Foundation & Plinth") — not a real FK, since no confirmed link to ScheduleActivity/DPR exists yet. */
  relatedWorkItem?: string;
  postedBy: string;
  postedByName: string;
  /** Admin/PM/site-engineer control over whether this update has reached the customer yet — mirrors `Document.visibleToCustomer`, but defaults to `true` here since surfacing updates is this module's whole purpose. */
  visibleToCustomer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteUpdateInput {
  projectId: string;
  updateDate: string;
  remarks: string;
  relatedWorkItem?: string;
  visibleToCustomer: boolean;
}

export interface UpdateSiteUpdateInput {
  updateDate?: string;
  remarks?: string;
  relatedWorkItem?: string;
  visibleToCustomer?: boolean;
}

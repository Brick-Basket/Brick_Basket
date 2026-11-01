import type { ProjectProgressSource } from "./project-progress-log";

/**
 * Project — minimal shape for now.
 *
 * Purpose: gives the Part 3 application shell (ProjectSelector, project
 * context) something real to switch between. This is intentionally a thin
 * slice of the eventual `Project` entity — almost every later module
 * (Contracts, Documents, Vendors, Supply Chain, Store, Schedule/DPR,
 * Finance) references a project by ID, and each of those parts will extend
 * this file with the fields it needs rather than duplicating a parallel
 * type. Not tied to one owning part in docs/MODULES.md for that reason.
 *
 * `progressPercentage` added in the Customer Module pass — the owner's
 * three-item scope for that module ("Payments", "Progress percentage",
 * "Progress photographs", relayed via WhatsApp, see docs/CHANGELOG.md)
 * named a project-wide completion percentage with no existing field or
 * computed aggregate anywhere in the app to back it at the time.
 *
 * Robustness follow-up (this pass, see docs/OPEN_QUESTIONS.md): the field
 * itself is unchanged, but it is no longer *only* a bare manually-typed
 * number. `src/lib/utils/project-progress.ts` can now derive a suggested
 * value from the existing Schedule module's own activity/quantity data
 * (`ScheduleActivity`/`ScheduleProgressEntry`, duration-weighted), and
 * every write to this field — whether staff type a number directly or
 * accept the computed suggestion — is logged to `ProjectProgressLogEntry`
 * (`project-progress-log.ts`) via `ProjectsAdapter.update`/`listProgressLog`.
 * This field still always wins for display — the computed figure is a
 * suggestion surfaced alongside it, never silently substituted.
 *
 * Backend ownership: persistence and the authoritative field set are
 * backend-owned once a real Project module/API exists.
 */
export interface Project {
  id: string;
  name: string;
  location: string;
  /** Distinguishes "my projects" for a customer session in the portal shell. */
  customerId?: string;
  /**
   * 0–100. Set either by staff typing a number directly, or by accepting
   * the Schedule-computed suggestion — see this file's header comment and
   * `project-progress.ts`. Not computed automatically on every read: it's
   * a snapshot, refreshed only when someone (or the "Use computed value"
   * action) writes a new value through `ProjectsAdapter.update`.
   */
  progressPercentage?: number;
}

/** Fields `ProjectsAdapter.update` accepts — intentionally narrow: only `progressPercentage` is editable through this app today. */
export type UpdateProjectInput = Partial<Pick<Project, "progressPercentage">> & {
  /**
   * Where this update came from — stamped onto the resulting
   * `ProjectProgressLogEntry`. Defaults to `"manual"` when omitted, so
   * every pre-existing call site (none outside this pass) keeps behaving
   * exactly as before.
   */
  source?: ProjectProgressSource;
  /** Free-text justification, surfaced in the progress history. See `ProjectProgressLogEntry.reason`'s doc comment for when the UI requires it. */
  reason?: string;
};

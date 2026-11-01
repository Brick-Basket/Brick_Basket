/**
 * Append-only audit trail for `Project.progressPercentage` changes — added
 * in the "robust progress mapping" pass (Customer Module follow-up, see
 * docs/OPEN_QUESTIONS.md and docs/CHANGELOG.md). Every change to a
 * project's progress percentage, however it was made, logs one entry here
 * so the number shown on the Customer Module can always be explained: who
 * changed it, when, from what to what, where it came from, and — when the
 * change overrides the Schedule-computed suggestion or moves the number
 * backwards — why.
 *
 * FRONTEND IMPLEMENTATION DECISION — there is no backend endpoint for this
 * yet (see docs/API_CONTRACTS.md). A real backend should persist this
 * server-side as part of `PATCH /api/projects/:id` rather than as a
 * separate client-maintained log the way `MockProjectsAdapter` keeps it
 * today (in-memory, lost on reload — same caveat as every other mock
 * adapter in this app).
 */
export type ProjectProgressSource = "manual" | "schedule_computed";

export interface ProjectProgressLogEntry {
  id: string;
  projectId: string;
  /** `null` only for a project's very first logged change. */
  previousPercentage: number | null;
  newPercentage: number;
  source: ProjectProgressSource;
  /**
   * Required by the UI (not enforced by the adapter — UX-layer guardrail
   * only, same caveat as `docs/ROLES_AND_PERMISSIONS.md`) when staff
   * override the Schedule-computed suggestion by more than
   * `PROGRESS_OVERRIDE_REASON_THRESHOLD` points, or move the percentage
   * backwards. Always optional at the type level since a plain
   * `source: "schedule_computed"` entry (staff just accepting the
   * computed figure) never needs one.
   */
  reason?: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
}

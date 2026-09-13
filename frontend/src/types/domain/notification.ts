/**
 * AppNotification — Cross-Module Polish (Part 19). "Notification events"
 * per the Part 19 blockquote and docs/OPEN_QUESTIONS.md #10 ("Notification
 * channels... and events that trigger them").
 *
 * There is **no `CreateAppNotificationInput`** and no persisted record —
 * same "pure computed aggregate" pattern as `CostToComplete` (Part 18,
 * see `src/types/domain/cost-to-complete.ts`'s header comment). A
 * notification here is not a row anyone ever wrote; it is a live
 * derivation of "does this already-existing record need this signed-in
 * user's attention right now" — recomputed on every call, never stored,
 * never marked read (there is nothing to mark: the notification simply
 * stops appearing once the underlying record no longer qualifies, e.g. a
 * Requisition is no longer "submitted" once someone decides it).
 *
 * **FRONTEND IMPLEMENTATION DECISION — in-app only, no email/SMS/WhatsApp
 * channel.** This answers docs/OPEN_QUESTIONS.md #10 for the frontend
 * build: there is no backend event bus or delivery mechanism to build
 * against, so every notification is computed at render time from
 * already-existing mock data across modules, exactly reflecting
 * docs/ARCHITECTURE.md's cross-module data-flow list. See
 * `NotificationsAdapter` in
 * `src/lib/api/adapters/notifications-adapter.ts` for the full
 * permission → condition → message rule table, and `docs/OPEN_QUESTIONS.md`
 * #40 for every decision this required.
 */
export type NotificationCategory =
  | "lead"
  | "requisition"
  | "purchase_order"
  | "grn"
  | "tax"
  | "schedule"
  | "contract"
  | "mrc";

export type NotificationSeverity = "info" | "warning" | "urgent";

export interface AppNotification {
  /** Stable within one computed batch — `${category}:${entityId}[:suffix]` — not a backend-issued id, since nothing is persisted. */
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  message: string;
  /** ISO timestamp of the underlying event this notification reflects (the record's own `createdAt`/`updatedAt`/due date) — sorted newest first. Never "now," the moment the report was computed. */
  createdAt: string;
  /** Route to the record (or, where no per-record detail route exists — Lead, Schedule — the owning list) this notification is about. */
  href: string;
}

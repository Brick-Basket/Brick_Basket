"use client";

import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { NotificationList } from "@/components/notifications/notification-list";
import { useNotifications } from "@/hooks/use-notifications";

/**
 * Notifications (Part 3 route, real content Part 19) — same
 * `useNotifications()` hook the Topbar bell and `/dashboard`/`/admin` use.
 * See `NotificationsAdapter` for the full rule table and
 * docs/NOTIFICATIONS.md.
 *
 * Copy updated in the Customer Module notifications follow-up
 * (docs/OPEN_QUESTIONS.md #81): this used to say "Contracts and Material
 * Receipt Certificates" because those were the only two rules a customer
 * ever saw. Site Updates, Payments, and Progress changes now generate one
 * each too (the single latest one per project/overall — see
 * `notifications-adapter.ts`'s header comment for why), so the copy below
 * describes all five rather than naming only the original two.
 */
export default function Page() {
  const { status, error, notifications, refetch } = useNotifications();

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Notifications</h1>
        <p className="text-sm text-ink-muted">
          Contracts and Material Receipt Certificates that need your review, plus the latest Site Update, Payment, and
          Progress change for your projects. This list is computed live — there is nothing to mark as read; an item
          disappears once it no longer applies (a Contract/MRC once reviewed, a Site Update/Payment/Progress entry once
          a newer one replaces it).
        </p>
      </div>

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load your notifications" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && (
        <NotificationList
          notifications={notifications}
          emptyDescription="Nothing needs your attention right now — new contracts, MRCs, site updates, payments, and progress changes will show up here."
        />
      )}
    </div>
  );
}

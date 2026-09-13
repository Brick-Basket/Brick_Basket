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
 */
export default function Page() {
  const { status, error, notifications, refetch } = useNotifications();

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Notifications</h1>
        <p className="text-sm text-ink-muted">
          Contracts and Material Receipt Certificates that need your review. This list is computed live — there is
          nothing to mark as read; an item disappears once it no longer needs your attention.
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
          emptyDescription="Nothing needs your attention right now — new contracts and MRCs to review will show up here."
        />
      )}
    </div>
  );
}

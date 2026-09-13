import Link from "next/link";
import { EmptyState } from "@/components/domain/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils/format";
import { NOTIFICATION_CATEGORY_CONFIG, NOTIFICATION_SEVERITY_TONE } from "@/components/notifications/notification-category-config";
import type { AppNotification } from "@/types/domain/notification";

/**
 * Full-width notification list — shared by `/dashboard/notifications` and
 * `/admin`'s "Needs your attention" section (see `useNotifications`).
 * `NotificationsMenu` (the Topbar bell) renders its own compact version
 * rather than reusing this, since it needs a fixed-width dropdown shape;
 * both read from the same hook so the underlying data never disagrees.
 */
export function NotificationList({ notifications, emptyDescription }: { notifications: AppNotification[]; emptyDescription: string }) {
  if (notifications.length === 0) {
    return <EmptyState title="You're all caught up" description={emptyDescription} />;
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border bg-surface">
      {notifications.map((n) => {
        const category = NOTIFICATION_CATEGORY_CONFIG[n.category];
        const Icon = category.icon;
        return (
          <li key={n.id}>
            <Link href={n.href} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-muted">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-ink">{n.message}</p>
                  <Badge variant={NOTIFICATION_SEVERITY_TONE[n.severity]}>{category.label}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(n.createdAt)}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

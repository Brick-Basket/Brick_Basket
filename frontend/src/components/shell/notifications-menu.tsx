"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useNotifications } from "@/hooks/use-notifications";
import { EmptyState } from "@/components/domain/empty-state";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Topbar notification entry point — Part 19. Now backed by
 * `useNotifications()` (the same hook `/dashboard/notifications`,
 * `/dashboard` and `/admin` all share) instead of a demo `items` prop —
 * see `NotificationsAdapter` for the cross-module event rules
 * (PO approvals, contract acceptance, overdue tax, etc., per
 * ARCHITECTURE.md's cross-module data flow). See docs/NOTIFICATIONS.md.
 */
export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const { status, notifications } = useNotifications();
  const count = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notifications${count ? ` (${count} unread)` : ""}`}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {count > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-red" aria-hidden />}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-md border border-border bg-surface shadow-card">
          <div className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">Notifications</div>
          {status === "loading" ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState title="No notifications yet" description="You're all caught up." className="py-10" />
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-border text-sm last:border-0">
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block px-4 py-3 hover:bg-surface-muted",
                      n.severity === "urgent" && "border-l-2 border-error",
                    )}
                  >
                    <p className="text-ink">{n.message}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(n.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

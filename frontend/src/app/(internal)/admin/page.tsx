"use client";

import {
  UserPlus,
  FileCheck2,
  ClipboardCheck,
  ThumbsUp,
  Truck,
  PackageSearch,
  ReceiptText,
  TrendingUp,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { EmptyState } from "@/components/domain/empty-state";
import { MetricCard } from "@/components/domain/metric-card";
import { NotificationList } from "@/components/notifications/notification-list";
import { useSession } from "@/components/providers/auth-provider";
import { useOpsMetrics } from "@/hooks/use-ops-metrics";
import { useNotifications } from "@/hooks/use-notifications";

/** Icon per `OpsMetric.id` — kept in the page rather than the adapter, since the adapter's output has no dependency on `lucide-react`. */
const METRIC_ICON: Record<string, LucideIcon> = {
  "new-leads": UserPlus,
  "contracts-pending-acceptance": FileCheck2,
  "requisitions-awaiting-approval": ClipboardCheck,
  "po-awaiting-l1": ThumbsUp,
  "po-awaiting-l2": ThumbsUp,
  "po-ready-to-release-or-issue": Truck,
  "issued-pos-without-grn": PackageSearch,
  "overdue-tax-count": ReceiptText,
  "projects-over-original-estimate": TrendingUp,
  "schedule-activities-behind": CalendarClock,
};

/**
 * Ops Dashboard (Part 3 route, real content Part 19) — a permission-gated
 * metric grid (`useOpsMetrics`) plus a "Needs your attention" section
 * reusing the same `useNotifications()` hook the Topbar bell and
 * `/dashboard/notifications` share, so the two surfaces never disagree.
 * Both hooks already filter to what the signed-in user's role covers —
 * see `OpsMetricsAdapter`/`NotificationsAdapter` for the full rule tables.
 */
export default function AdminHome() {
  const { session } = useSession();
  const { status: metricsStatus, error: metricsError, metrics, refetch: refetchMetrics } = useOpsMetrics();
  const { status: notificationsStatus, notifications } = useNotifications();

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">
          {session ? `Welcome back, ${session.user.name.split(" ")[0]}` : "Operations Dashboard"}
        </h1>
        <p className="text-sm text-ink-muted">
          Cross-module metrics computed live from every operations module — figures shown reflect this demo&apos;s
          seeded data, not the owner&apos;s real numbers.
        </p>
      </div>

      {metricsStatus === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {metricsStatus === "error" && (
        <ErrorState title="Could not load dashboard metrics" description={metricsError ?? undefined} onRetry={refetchMetrics} />
      )}

      {metricsStatus === "success" && metrics.length === 0 && (
        <EmptyState title="No metrics available for your role yet" description="Your permissions don't cover any of this dashboard's current metric cards." />
      )}

      {metricsStatus === "success" && metrics.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              icon={METRIC_ICON[metric.id]}
              href={metric.href}
              tone={metric.tone}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Needs your attention</h2>
        {notificationsStatus === "loading" ? (
          <LoadingSkeleton className="h-16 w-full" />
        ) : (
          <NotificationList
            notifications={notifications.slice(0, 8)}
            emptyDescription="Nothing across your modules needs attention right now."
          />
        )}
      </div>
    </div>
  );
}

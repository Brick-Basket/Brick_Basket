"use client";

import { Sheet } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/domain/status-badge";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ErrorState } from "@/components/domain/error-state";
import { useScheduleProgress } from "@/hooks/use-schedule";
import { ScheduleProgressLog } from "@/components/schedule/schedule-progress-log";
import { getDelayDays, getExecutedQuantity, getPercentComplete, getProgressState } from "@/components/schedule/schedule-progress-math";
import { SCHEDULE_PROGRESS_STATE_CONFIG } from "@/components/schedule/schedule-progress-config";
import { formatDate } from "@/lib/utils/format";
import type { ScheduleActivity } from "@/types/domain/project-schedule";

/**
 * Slide-over showing one activity's planned figures plus its full progress
 * history and the "record a new reading" form — the required "schedule
 * tracking where the Project Manager updates executed quantities."
 */
export function ScheduleProgressSheet({ activity, onClose }: { activity: ScheduleActivity | null; onClose: () => void }) {
  const { status, error, entries, refetch } = useScheduleProgress(activity?.id ?? null);

  const executedQuantity = getExecutedQuantity(entries);
  const percentComplete = activity ? getPercentComplete(activity, executedQuantity) : 0;
  const progressState = activity ? getProgressState(activity, percentComplete) : "not_started";
  const delayDays = activity ? getDelayDays(activity, percentComplete) : 0;

  return (
    <Sheet open={!!activity} onClose={onClose} title={activity?.activity ?? "Activity"} description={activity ? `${activity.uom} · ${activity.quantity.toLocaleString("en-IN")} planned` : undefined}>
      {!activity ? null : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={progressState} config={SCHEDULE_PROGRESS_STATE_CONFIG} />
              {delayDays > 0 && (
                <span className="text-sm font-medium text-error">
                  {delayDays} {delayDays === 1 ? "day" : "days"} delayed
                </span>
              )}
            </div>
            <p className="text-sm text-ink-muted">
              {formatDate(activity.plannedStart)} – {formatDate(activity.plannedEnd)}
            </p>
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium text-ink">
                {executedQuantity.toLocaleString("en-IN")} / {activity.quantity.toLocaleString("en-IN")} {activity.uom}
              </span>
              <span className="text-ink-muted">{percentComplete.toFixed(0)}% complete</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className={
                  progressState === "overdue"
                    ? "h-full bg-error"
                    : progressState === "behind"
                      ? "h-full bg-warning"
                      : "h-full bg-success"
                }
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {activity.notes && <p className="text-sm text-ink-muted">{activity.notes}</p>}

          <div className="border-t border-border pt-4">
            <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Progress History</h3>
            {status === "loading" && (
              <div className="flex flex-col gap-3">
                <LoadingSkeleton className="h-16 w-full" />
                <LoadingSkeleton className="h-16 w-full" />
              </div>
            )}
            {status === "error" && <ErrorState title="Could not load progress history" description={error ?? undefined} onRetry={refetch} />}
            {status === "success" && <ScheduleProgressLog activity={activity} entries={entries} onEntryAdded={refetch} />}
          </div>
        </div>
      )}
    </Sheet>
  );
}

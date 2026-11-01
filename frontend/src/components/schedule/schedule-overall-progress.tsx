"use client";

import { useScheduleBasedProgress } from "@/hooks/use-project-progress";
import { formatDateTime } from "@/lib/utils/format";

/**
 * FEATURE ADDITION (owner follow-up on the Schedule page: "where will the
 * overall percentage be shown"). Read-only "whole project" progress
 * convenience, rendered above the Gantt/table on
 * `/admin/project-management/schedule`.
 *
 * Per-activity, Schedule already shows its own `percentComplete` (table +
 * Gantt bar fill), but nothing on this page ever rolled every activity up
 * into one "how far along is this project overall" figure — that number
 * already existed, just one screen away: `computeScheduleBasedProgress`
 * (`src/lib/utils/project-progress.ts`) reduces this exact same project's
 * `ScheduleActivity`/`ScheduleProgressEntry` data into a duration-weighted
 * completion percentage, and already powers both the Customer Detail
 * screen's `CustomerProjectProgress` editor (where staff accept or
 * override it as `Project.progressPercentage`) and the customer portal's
 * read-only `ProjectProgressSummary`. This component is deliberately NOT a
 * second, competing progress figure — it calls the exact same hook
 * (`useScheduleBasedProgress`) and shows the exact same number, just
 * surfaced one level earlier: right where the per-activity entries it's
 * computed from are actually being viewed/edited, so staff don't have to
 * navigate to this project's Customer record just to see what their own
 * schedule entries currently add up to.
 *
 * Purely a readout — no edit control, no "Use this value" action, no
 * write path. `Project.progressPercentage` (the number actually shown to
 * the customer) can only be changed from `CustomerProjectProgress`
 * (`customers:write`), unchanged by this addition; a schedule-only user
 * without `customers:write` can still see this card, but can't act on it,
 * matching this page's existing `schedule:read`/`schedule:write` split.
 */
export function ScheduleOverallProgress({ projectId }: { projectId: string }) {
  const { status, result } = useScheduleBasedProgress(projectId);

  if (status === "loading") {
    return <div className="h-[72px] w-full animate-pulse rounded-card bg-surface-muted" aria-hidden />;
  }

  // `null` only when the project has no Schedule activities at all — the
  // page's own "No activities yet" empty state already covers that case,
  // so this renders nothing rather than a second, redundant empty message.
  if (status !== "success" || !result) return null;

  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">Overall Progress</p>
        {result.asOf && <p className="text-xs text-ink-muted">Site data as of {formatDateTime(result.asOf)}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-brand-red transition-[width]"
            style={{ width: `${Math.min(100, Math.max(0, result.percentage))}%` }}
          />
        </div>
        <span className="w-14 text-right text-base font-semibold text-ink">{result.percentage}%</span>
      </div>
      <p className="text-xs text-ink-muted">
        Duration-weighted across every activity below — the same figure shown on this project&apos;s Customer record.
      </p>
    </div>
  );
}

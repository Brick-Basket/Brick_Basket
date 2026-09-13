"use client";

import { TrendingUp, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/domain/status-badge";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { formatDate } from "@/lib/utils/format";
import { getDelayDays, getExecutedQuantity, getPercentComplete, getProgressState } from "@/components/schedule/schedule-progress-math";
import { SCHEDULE_PROGRESS_STATE_CONFIG } from "@/components/schedule/schedule-progress-config";
import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

/**
 * The "schedule-table" half of the Gantt/schedule-table hybrid — activity,
 * UOM, quantity, planned dates, and the pro-rata progress bar with its
 * computed status, per row. `progressByActivity` is a pre-fetched map so
 * this table doesn't issue one progress-history request per row.
 */
export function ScheduleTable({
  activities,
  progressByActivity,
  sortBy,
  sortDir,
  onSortChange,
  onEdit,
  onUpdateProgress,
}: {
  activities: ScheduleActivity[];
  progressByActivity: Map<string, ScheduleProgressEntry[]>;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onEdit?: (activity: ScheduleActivity) => void;
  onUpdateProgress: (activity: ScheduleActivity) => void;
}) {
  const columns: DataTableColumn<ScheduleActivity>[] = [
    {
      key: "activity",
      header: "Activity",
      sortKey: "activity",
      render: (a) => <p className="font-medium text-ink">{a.activity}</p>,
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (a) => `${a.quantity.toLocaleString("en-IN")} ${a.uom}`,
    },
    {
      key: "planned",
      header: "Planned Dates",
      sortKey: "plannedStart",
      render: (a) => (
        <span className="whitespace-nowrap">
          {formatDate(a.plannedStart)} – {formatDate(a.plannedEnd)}
        </span>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (a) => {
        const executed = getExecutedQuantity(progressByActivity.get(a.id) ?? []);
        const percent = getPercentComplete(a, executed);
        const state = getProgressState(a, percent);
        return (
          <div className="flex min-w-[9rem] flex-col gap-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className={
                  state === "overdue" ? "h-full bg-error" : state === "behind" ? "h-full bg-warning" : "h-full bg-success"
                }
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs text-ink-muted">{percent.toFixed(0)}%</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const executed = getExecutedQuantity(progressByActivity.get(a.id) ?? []);
        const percent = getPercentComplete(a, executed);
        return <StatusBadge status={getProgressState(a, percent)} config={SCHEDULE_PROGRESS_STATE_CONFIG} />;
      },
    },
    {
      key: "delay",
      header: "Delay",
      render: (a) => {
        // FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization
        // pass, Phase 3): the owner's "delay-in-days reflection" requirement
        // was implemented as a computation (`getDelayDays`) from the start
        // (Part 13), but never actually surfaced anywhere on screen — the
        // table and Gantt only ever showed the progress bar/status color.
        // See `docs/OPEN_QUESTIONS.md` for why this stays a plain "days past
        // plannedEnd" figure rather than a projected-finish-date model.
        const executed = getExecutedQuantity(progressByActivity.get(a.id) ?? []);
        const percent = getPercentComplete(a, executed);
        const delayDays = getDelayDays(a, percent);
        if (delayDays <= 0) return <span className="text-ink-muted">—</span>;
        return (
          <span className="font-medium text-error">
            {delayDays} {delayDays === 1 ? "day" : "days"}
          </span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={activities}
      keyFor={(a) => a.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      rowActions={(a) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onUpdateProgress(a)}>
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            Update Progress
          </Button>
          {onEdit && (
            <PermissionGuard permission="schedule:write">
              <Button variant="ghost" size="sm" onClick={() => onEdit(a)} aria-label="Edit activity">
                <Pencil className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </PermissionGuard>
          )}
        </div>
      )}
    />
  );
}

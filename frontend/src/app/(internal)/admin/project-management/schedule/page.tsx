"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useScheduleActivities, useScheduleProgressMap } from "@/hooks/use-schedule";
import { ScheduleFilters } from "@/components/schedule/schedule-filters";
import { ScheduleGanttChart } from "@/components/schedule/schedule-gantt-chart";
import { ScheduleTable } from "@/components/schedule/schedule-table";
import { ScheduleMonthlyPlanTable } from "@/components/schedule/schedule-monthly-plan-table";
import { ScheduleActivityForm } from "@/components/schedule/schedule-activity-form";
import { ScheduleProgressSheet } from "@/components/schedule/schedule-progress-sheet";
import type { ScheduleActivity } from "@/types/domain/project-schedule";
import type { ScheduleListParams } from "@/lib/api/adapters/schedule-adapter";

// Every activity for the selected project is loaded at once (no
// Pagination control) — the Gantt half of this view needs every row
// visible together for the chart to make sense.
const PAGE_SIZE = 200;

export default function AdminSchedulePage() {
  return (
    <PermissionGuard
      permission="schedule:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to the Project Schedule" description="Ask an administrator for the schedule:read permission." />
        </div>
      }
    >
      <AdminScheduleContent />
    </PermissionGuard>
  );
}

function AdminScheduleContent() {
  // Defaults to Modern Residence — the project with the fullest seeded
  // schedule (every computed progress state is represented there); any
  // project can still be picked from the filter, including one with no
  // schedule data yet, to exercise the empty state. BrickBasket final
  // hardening pass (P2 mock import cleanup): this is a plain default id,
  // not a live lookup, so it no longer needs `mockProjects` at all — the
  // actual project list (for `ScheduleFilters`' dropdown) is loaded
  // through the Schedule adapter's own project-scoped hook, not read
  // directly from mock data here.
  const [filters, setFilters] = useState<ScheduleListParams>({
    projectId: "proj_modern_residence",
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "sequence",
    sortDir: "asc",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ScheduleActivity | null>(null);
  const [progressActivity, setProgressActivity] = useState<ScheduleActivity | null>(null);

  const { status, error, result, refetch } = useScheduleActivities(filters);
  const activityIds = (result?.items ?? []).map((a) => a.id);
  const { map: progressByActivity, refetch: refetchProgress } = useScheduleProgressMap(activityIds);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as ScheduleListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingActivity(null);
  };

  const closeProgressSheet = () => {
    setProgressActivity(null);
    refetchProgress();
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Project Schedule</h1>
          <p className="text-sm text-ink-muted">Activity, quantity, UOM and planned dates, tracked against actual executed quantities.</p>
        </div>
        <PermissionGuard permission="schedule:write">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New Activity
          </Button>
        </PermissionGuard>
      </div>

      <ScheduleFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-40 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load the schedule" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No activities yet" description="Add the first activity for this project to start tracking its schedule." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <ScheduleGanttChart activities={result.items} progressByActivity={progressByActivity} />
          <ScheduleTable
            activities={result.items}
            progressByActivity={progressByActivity}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onEdit={(activity) => {
              setEditingActivity(activity);
              setShowForm(true);
            }}
            onUpdateProgress={setProgressActivity}
          />
          <ScheduleMonthlyPlanTable activities={result.items} />
        </>
      )}

      <Dialog open={showForm} onClose={closeForm} title={editingActivity ? "Edit Activity" : "New Activity"}>
        <ScheduleActivityForm
          mode={editingActivity ? "edit" : "create"}
          activity={editingActivity ?? undefined}
          onCancel={closeForm}
          onSuccess={() => {
            closeForm();
            refetch();
          }}
        />
      </Dialog>

      <ScheduleProgressSheet activity={progressActivity} onClose={closeProgressSheet} />
    </div>
  );
}

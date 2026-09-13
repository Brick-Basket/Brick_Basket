"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useDPR, useDPRWorkItemHistory } from "@/hooks/use-dpr";
import { DPRManpowerTable } from "@/components/dpr/dpr-manpower-table";
import { DPRWorkItemsTable } from "@/components/dpr/dpr-work-items-table";
import { getTotalManpower } from "@/components/dpr/dpr-work-item-math";
import { useProjects } from "@/hooks/use-projects";
import { formatDate, formatDateTime } from "@/lib/utils/format";

/**
 * Read + edit-entry surface for a single DPR, used by
 * `/admin/project-management/dpr/[id]`. There is no status/workflow here —
 * a DPR has no stored status (see `docs/STATUS_DEFINITIONS.md`'s Part 14
 * note) and no customer-facing counterpart, unlike `MRCDetail`.
 */
export function DPRDetail({ dprId, onEdit }: { dprId: string; onEdit: () => void }) {
  const { status, error, dpr, manpower, workItems, refetch } = useDPR(dprId);
  const { history } = useDPRWorkItemHistory(dpr?.projectId ?? null);
  const { projects: allProjects } = useProjects();

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-1/2" />
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-48 w-full" />
      </div>
    );
  }

  if (status === "error" || !dpr) {
    return <ErrorState title="Could not load this daily progress report" description={error ?? undefined} onRetry={refetch} />;
  }

  const project = allProjects.find((p) => p.id === dpr.projectId);
  const totalManpower = manpower.reduce((sum, m) => sum + getTotalManpower(m.skilled, m.unskilled), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{dpr.dprNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">Daily Progress Report</h2>
          {project && <p className="text-sm text-ink-muted">{project.name}</p>}
        </div>
        <PermissionGuard permission="dpr:write">
          <Button variant="outline" onClick={onEdit}>
            Edit DPR
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 pt-6 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-ink-muted">Report Date</p>
            <p className="text-ink">{formatDate(dpr.reportDate)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Prepared By</p>
            <p className="text-ink">{dpr.preparedByName}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Total Manpower</p>
            <p className="text-ink">{totalManpower}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Work Items Logged</p>
            <p className="text-ink">{workItems.length}</p>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Manpower</h3>
        <DPRManpowerTable entries={manpower} />
      </div>

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Work Items</h3>
        <DPRWorkItemsTable dpr={dpr} lines={workItems} history={history} />
      </div>

      {dpr.notes && (
        <div>
          <h3 className="mb-2 font-heading text-sm font-semibold text-ink">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{dpr.notes}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(dpr.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Last Updated</dt>
          <dd className="text-ink">{formatDateTime(dpr.updatedAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

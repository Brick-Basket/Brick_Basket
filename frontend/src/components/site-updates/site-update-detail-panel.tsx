"use client";

import { Calendar, Hammer } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSiteUpdate, useUpdateSiteUpdate } from "@/hooks/use-site-updates";
import { SiteUpdateMediaGrid } from "@/components/site-updates/site-update-media-grid";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";

/**
 * Full detail view for one Site Update — mirrors `DocumentPreviewPanel`'s
 * Sheet-based pattern and its guarded-refetch fix (only refetch on a
 * successful mutation, per docs/OPEN_QUESTIONS.md #45). `perspective`
 * gates the visibility toggle the same way it gates Document Management's.
 */
export function SiteUpdateDetailPanel({
  updateId,
  perspective,
  onClose,
}: {
  updateId: string | null;
  perspective: "admin" | "customer";
  onClose: () => void;
}) {
  const { status, error, update, refetch } = useSiteUpdate(updateId);
  const { submit: updateSiteUpdate, status: updateStatus, error: updateError } = useUpdateSiteUpdate();
  const { projects: allProjects } = useProjects();

  const project = update ? allProjects.find((p) => p.id === update.projectId) : null;

  const handleToggleVisibility = async () => {
    if (!update) return;
    const updated = await updateSiteUpdate(update.id, { visibleToCustomer: !update.visibleToCustomer });
    if (updated) refetch();
  };

  return (
    <Sheet
      open={!!updateId}
      onClose={onClose}
      title={update ? formatDate(update.updateDate) : "Site Update"}
      description={project?.name}
      widthClassName="max-w-2xl"
    >
      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-48 w-full" />
          <LoadingSkeleton className="h-4 w-2/3" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load this update" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && update && (
        <div className="flex flex-col gap-6">
          <SiteUpdateMediaGrid media={update.media} />

          <p className="text-sm text-ink">{update.remarks}</p>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Project</dt>
              <dd className="text-ink">{project?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-xs text-ink-muted">
                <Calendar className="h-3 w-3" aria-hidden /> Update Date
              </dt>
              <dd className="text-ink">{formatDate(update.updateDate)}</dd>
            </div>
            {update.relatedWorkItem && (
              <div className="col-span-2">
                <dt className="flex items-center gap-1 text-xs text-ink-muted">
                  <Hammer className="h-3 w-3" aria-hidden /> Related Work Item
                </dt>
                <dd className="text-ink">{update.relatedWorkItem}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-xs text-ink-muted">Posted</dt>
              <dd className="text-ink">
                {formatDateTime(update.createdAt)} · {update.postedByName}
              </dd>
            </div>
          </dl>

          {perspective === "admin" && (
            <PermissionGuard permission="site_updates:write">
              <div className="border-t border-border pt-4">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <Checkbox
                    checked={update.visibleToCustomer}
                    onChange={handleToggleVisibility}
                    disabled={updateStatus === "loading"}
                  />
                  Visible to customer
                </label>
                {updateError && <p className="mt-1 text-xs text-error">{updateError}</p>}
              </div>
            </PermissionGuard>
          )}
        </div>
      )}
    </Sheet>
  );
}

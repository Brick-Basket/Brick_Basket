"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSiteUpdates } from "@/hooks/use-site-updates";
import { useProjects } from "@/hooks/use-projects";
import { SiteUpdateCard } from "@/components/site-updates/site-update-card";
import { SiteUpdateUploadForm } from "@/components/site-updates/site-update-upload-form";
import { SiteUpdateDetailPanel } from "@/components/site-updates/site-update-detail-panel";
import type { SiteUpdateListParams } from "@/lib/api/adapters/site-updates-adapter";

const PAGE_SIZE = 9;

export default function AdminSiteUpdatesPage() {
  return (
    <PermissionGuard
      permission="site_updates:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Site Updates" />
        </div>
      }
    >
      <AdminSiteUpdatesContent />
    </PermissionGuard>
  );
}

function AdminSiteUpdatesContent() {
  const { projects: allProjects } = useProjects();
  const [projectId, setProjectId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const listParams: SiteUpdateListParams = {
    projectId: projectId || undefined,
    page,
    pageSize: PAGE_SIZE,
    sortDir: "desc",
  };
  const { status, error, result, refetch } = useSiteUpdates(listParams);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Site Updates</h1>
          <p className="text-sm text-ink-muted">
            Daily site photos and videos posted from the field — visible to the customer once shared.
          </p>
        </div>
        <PermissionGuard permission="site_updates:write">
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Post Update
          </Button>
        </PermissionGuard>
      </div>

      <div className="max-w-xs">
        <Select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by project"
        >
          <option value="">All Projects</option>
          {allProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>

      {status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load site updates" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState
          title="No site updates yet"
          description="Post the first daily update — photos and videos shared here appear in the customer's portal."
        />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((update) => (
              <SiteUpdateCard key={update.id} update={update} showVisibilityBadge onClick={() => setDetailId(update.id)} />
            ))}
          </div>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
        </>
      )}

      <Dialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Post Update"
        description="Share today's progress — photos, videos, and a short remark."
      >
        <SiteUpdateUploadForm
          onCancel={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            refetch();
          }}
        />
      </Dialog>

      <SiteUpdateDetailPanel updateId={detailId} perspective="admin" onClose={() => setDetailId(null)} />
    </div>
  );
}

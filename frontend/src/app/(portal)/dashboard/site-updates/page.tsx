"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useProjectContext } from "@/components/providers/project-provider";
import { useSiteUpdates } from "@/hooks/use-site-updates";
import { SiteUpdateCard } from "@/components/site-updates/site-update-card";
import { SiteUpdateDetailPanel } from "@/components/site-updates/site-update-detail-panel";
import type { SiteUpdateListParams } from "@/lib/api/adapters/site-updates-adapter";

const PAGE_SIZE = 9;

export default function MySiteUpdatesPage() {
  return (
    <PermissionGuard
      permission="site_updates:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Site Updates" />
        </div>
      }
    >
      <MySiteUpdatesContent />
    </PermissionGuard>
  );
}

/**
 * Customer portal Site Updates feed — the "daily photo/video upload"
 * feature's viewing side. Read-only, same scoping rules as
 * `/dashboard/documents`: `visibleToCustomer: true` is always forced into
 * the query, and results are scoped to the project currently selected in
 * the global project selector (ProjectContext). Both are frontend
 * safeguards only; the real backend's customer-facing endpoint must
 * enforce both server-side regardless.
 */
function MySiteUpdatesContent() {
  const { projects, selected } = useProjectContext();
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);

  const listParams: SiteUpdateListParams = {
    visibleToCustomer: true,
    projectId: selected?.id,
    page,
    pageSize: PAGE_SIZE,
    sortDir: "desc",
  };
  const { status, error, result, refetch } = useSiteUpdates(listParams);

  if (projects.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={Camera}
          title="No project yet"
          description="Once a project is set up for you, daily site photos and videos will appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Site Updates</h1>
        <p className="text-sm text-ink-muted">
          Daily photos and videos from {selected?.name ?? "your project"} — no site visit needed to follow progress.
        </p>
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
          icon={Camera}
          title="No updates yet"
          description="Daily site photos and videos BrickBasket shares for this project will appear here."
        />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((update) => (
              <SiteUpdateCard key={update.id} update={update} onClick={() => setDetailId(update.id)} />
            ))}
          </div>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={setPage} />
        </>
      )}

      <SiteUpdateDetailPanel updateId={detailId} perspective="customer" onClose={() => setDetailId(null)} />
    </div>
  );
}

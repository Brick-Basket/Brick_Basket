"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useDPRs } from "@/hooks/use-dpr";
import { DPRFilters } from "@/components/dpr/dpr-filters";
import { DPRTable } from "@/components/dpr/dpr-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { DPRListParams } from "@/lib/api/adapters/dpr-adapter";

const PAGE_SIZE = 10;

export default function AdminDPRPage() {
  return (
    <PermissionGuard
      permission="dpr:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Daily Progress Reports" description="Ask an administrator for the dpr:read permission." />
        </div>
      }
    >
      <AdminDPRContent />
    </PermissionGuard>
  );
}

function AdminDPRContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<DPRListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "reportDate",
    sortDir: "desc",
  });
  const { status, error, result, refetch } = useDPRs(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as DPRListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Daily Progress Reports</h1>
          <p className="text-sm text-ink-muted">Manpower and work-item quantities logged per project per day, optionally linked to Project Schedule.</p>
        </div>
        <PermissionGuard permission="dpr:write">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.dpr}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New DPR
          </Button>
        </PermissionGuard>
      </div>

      <DPRFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load daily progress reports" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No DPRs match these filters" description="Try clearing a filter, or log a new daily progress report." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <DPRTable
            dprs={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(dpr) => router.push(`${ADMIN_ROUTES.dpr}/${dpr.id}`)}
          />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}
    </div>
  );
}

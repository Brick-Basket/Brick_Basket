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
import { useRequisitions } from "@/hooks/use-requisitions";
import { RequisitionFilters } from "@/components/requisitions/requisition-filters";
import { RequisitionTable } from "@/components/requisitions/requisition-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { RequisitionListParams } from "@/lib/api/adapters/requisitions-adapter";

const PAGE_SIZE = 10;

export default function AdminRequisitionsPage() {
  return (
    <PermissionGuard
      permission="requisitions:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Purchase / Material Requisitions" />
        </div>
      }
    >
      <AdminRequisitionsContent />
    </PermissionGuard>
  );
}

function AdminRequisitionsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<RequisitionListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "createdAt", sortDir: "desc" });
  const { status, error, result, refetch } = useRequisitions(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as RequisitionListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Purchase / Material Requisition</h1>
          <p className="text-sm text-ink-muted">Raise material requirements against ACE rates for a project, or as additional free-entry items.</p>
        </div>
        <PermissionGuard permission="requisitions:create">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.requisitions}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New Requisition
          </Button>
        </PermissionGuard>
      </div>

      <RequisitionFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load requisitions" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No requisitions match these filters" description="Try clearing a filter, or create a new requisition." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <RequisitionTable
            requisitions={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(requisition) => router.push(`${ADMIN_ROUTES.requisitions}/${requisition.id}`)}
          />
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
        </>
      )}
    </div>
  );
}

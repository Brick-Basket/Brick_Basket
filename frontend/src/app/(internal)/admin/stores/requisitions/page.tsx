"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useStoreRequisitions } from "@/hooks/use-store-requisitions";
import { StoreRequisitionFilters } from "@/components/store-requisitions/store-requisition-filters";
import { StoreRequisitionTable } from "@/components/store-requisitions/store-requisition-table";
import { StoreRequisitionForm } from "@/components/store-requisitions/store-requisition-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { StoreRequisitionListParams } from "@/lib/api/adapters/store-requisitions-adapter";

const PAGE_SIZE = 10;

/**
 * `/admin/stores/requisitions` — Store Material Requisition ("MR", §6B),
 * added in the post-Part-20 stabilization pass (Phase 2). See
 * `src/types/domain/store-requisition.ts`'s header comment for why this
 * is a separate module from Purchase Requisition (Part 8).
 */
export default function AdminStoreRequisitionsPage() {
  return (
    <PermissionGuard
      permission="store_requisitions:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Material Requisitions" />
        </div>
      }
    >
      <AdminStoreRequisitionsContent />
    </PermissionGuard>
  );
}

function AdminStoreRequisitionsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<StoreRequisitionListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [showForm, setShowForm] = useState(false);
  const { status, error, result, refetch } = useStoreRequisitions(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as StoreRequisitionListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Material Requisitions (MR)</h1>
          <p className="text-sm text-ink-muted">
            Site/Project Manager requests for material already in stock, flowing to Stores for issuance.
          </p>
        </div>
        <PermissionGuard permission="store_requisitions:create">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New Request
          </Button>
        </PermissionGuard>
      </div>

      <StoreRequisitionFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load requests" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No requests match these filters" description="Try clearing a filter, or raise a new request." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <StoreRequisitionTable
            requisitions={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(r) => router.push(`${ADMIN_ROUTES.storeRequisitions}/${r.id}`)}
          />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} title="New Material Requisition">
        <StoreRequisitionForm
          mode="create"
          onCancel={() => setShowForm(false)}
          onSuccess={(created) => {
            setShowForm(false);
            refetch();
            router.push(`${ADMIN_ROUTES.storeRequisitions}/${created.id}`);
          }}
        />
      </Dialog>
    </div>
  );
}

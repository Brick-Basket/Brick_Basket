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
import { useRFQs } from "@/hooks/use-rfq";
import { RFQFilters } from "@/components/rfq/rfq-filters";
import { RFQTable } from "@/components/rfq/rfq-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { RFQListParams } from "@/lib/api/adapters/rfq-adapter";

const PAGE_SIZE = 10;

export default function AdminRFQsPage() {
  return (
    <PermissionGuard
      permission="rfq:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to RFQ Management" />
        </div>
      }
    >
      <AdminRFQsContent />
    </PermissionGuard>
  );
}

function AdminRFQsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<RFQListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "createdAt", sortDir: "desc" });
  const { status, error, result, refetch } = useRFQs(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as RFQListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">RFQ Management</h1>
          <p className="text-sm text-ink-muted">Compare vendor quotes against ACE rates for each approved requisition, then finalize a vendor per line.</p>
        </div>
        <PermissionGuard permission="rfq:compare">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.rfqs}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New RFQ
          </Button>
        </PermissionGuard>
      </div>

      <RFQFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load RFQs" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No RFQs match these filters" description="Try clearing a filter, or create a new RFQ from an approved requisition." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <RFQTable
            rfqs={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(rfq) => router.push(`${ADMIN_ROUTES.rfqs}/${rfq.id}`)}
          />
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
        </>
      )}
    </div>
  );
}

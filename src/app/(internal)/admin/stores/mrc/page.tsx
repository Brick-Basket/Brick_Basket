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
import { useMRCs } from "@/hooks/use-mrc";
import { useCustomers } from "@/hooks/use-customers";
import { MRCFilters } from "@/components/mrc/mrc-filters";
import { MRCTable } from "@/components/mrc/mrc-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { MRCListParams } from "@/lib/api/adapters/mrc-adapter";

const PAGE_SIZE = 10;

export default function AdminMRCPage() {
  return (
    <PermissionGuard
      permission="mrc:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Material Receipt Certificates" description="Ask an administrator for the mrc:read permission." />
        </div>
      }
    >
      <AdminMRCContent />
    </PermissionGuard>
  );
}

function AdminMRCContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<MRCListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { status, error, result, refetch } = useMRCs(filters);
  const { customers } = useCustomers();
  const customersById = new Map(customers.map((c) => [c.id, c]));

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as MRCListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Material Receipt Certificates</h1>
          <p className="text-sm text-ink-muted">Materials used, make and warranty terms — issued to customers for acceptance, mirrored in their portal.</p>
        </div>
        <PermissionGuard permission="mrc:issue">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.mrc}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New MRC
          </Button>
        </PermissionGuard>
      </div>

      <MRCFilters value={filters} customers={customers} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load MRCs" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No MRCs match these filters" description="Try clearing a filter, or create a new certificate." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <MRCTable
            mrcs={result.items}
            customersById={customersById}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(mrc) => router.push(`${ADMIN_ROUTES.mrc}/${mrc.id}`)}
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

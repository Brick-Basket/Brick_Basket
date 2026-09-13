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
import { useVendors } from "@/hooks/use-vendors";
import { VendorFilters } from "@/components/vendors/vendor-filters";
import { VendorTable } from "@/components/vendors/vendor-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { VendorListParams } from "@/lib/api/adapters/vendors-adapter";

const PAGE_SIZE = 10;

export default function AdminVendorsPage() {
  return (
    <PermissionGuard
      permission="vendors:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Vendor Management" />
        </div>
      }
    >
      <AdminVendorsContent />
    </PermissionGuard>
  );
}

function AdminVendorsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<VendorListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { status, error, result, refetch } = useVendors(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as VendorListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Vendor Management</h1>
          <p className="text-sm text-ink-muted">Vendor master, code series, 0–10 assessments, and past work.</p>
        </div>
        <PermissionGuard permission="vendors:write">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.vendors}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New Vendor
          </Button>
        </PermissionGuard>
      </div>

      <VendorFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load vendors" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No vendors match these filters" description="Try clearing a filter, or add a new vendor." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <VendorTable
            vendors={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(vendor) => router.push(`${ADMIN_ROUTES.vendors}/${vendor.id}`)}
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

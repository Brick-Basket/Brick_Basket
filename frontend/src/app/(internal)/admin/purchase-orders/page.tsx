"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { EmptyState } from "@/components/domain/empty-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { useProjectContext } from "@/components/providers/project-provider";
import { POFilters } from "@/components/po/po-filters";
import { POTable } from "@/components/po/po-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { PurchaseOrderListParams } from "@/lib/api/adapters/purchase-orders-adapter";

const PAGE_SIZE = 10;

export default function AdminPurchaseOrdersPage() {
  return (
    <PermissionGuard
      permission="po:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Purchase Orders" />
        </div>
      }
    >
      <AdminPurchaseOrdersContent />
    </PermissionGuard>
  );
}

function AdminPurchaseOrdersContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<PurchaseOrderListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "createdAt", sortDir: "desc" });

  // BrickBasket "Global Project Selector" correction: this page's own
  // project filter follows the shared `ProjectProvider` selection on
  // every change — not just once on load — so switching the project in
  // the admin topbar while already on this page actually does
  // something. That following stops the moment the user touches this
  // page's own project filter directly (a specific project OR "All
  // projects" — both count): from then on it's independently the
  // user's own choice for the rest of this visit. A fresh visit
  // (this component remounts on navigation) always re-seeds from
  // whatever is currently shared.
  const { selected } = useProjectContext();
  const userOverrodeProjectRef = useRef(false);
  useEffect(() => {
    if (userOverrodeProjectRef.current) return;
    if (selected) {
      setFilters((prev) => (prev.projectId === selected.id ? prev : { ...prev, projectId: selected.id }));
    }
  }, [selected]);
  const handleFiltersChange = (next: PurchaseOrderListParams) => {
    if (next.projectId !== filters.projectId) userOverrodeProjectRef.current = true;
    setFilters(next);
  };

  const { status, error, result, refetch } = usePurchaseOrders(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as PurchaseOrderListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Purchase Orders</h1>
        <p className="text-sm text-ink-muted">
          Created per vendor from a finalized RFQ, then carried through two-level approval, release and issuance. Start a new one from an RFQ detail page.
        </p>
      </div>

      <POFilters value={filters} onChange={handleFiltersChange} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load Purchase Orders" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState
          title="No Purchase Orders match these filters"
          description="Try clearing a filter, or create one from a finalized RFQ's vendor group."
          action={
            <PermissionGuard permission="rfq:read">
              <Button variant="outline" onClick={() => router.push(ADMIN_ROUTES.rfqs)}>
                View RFQs
              </Button>
            </PermissionGuard>
          }
        />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <POTable
            purchaseOrders={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(po) => router.push(`${ADMIN_ROUTES.purchaseOrders}/${po.id}`)}
          />
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))} />
        </>
      )}
    </div>
  );
}

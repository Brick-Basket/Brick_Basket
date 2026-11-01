"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useContracts } from "@/hooks/use-contracts";
import { useCustomers } from "@/hooks/use-customers";
import { useProjectContext } from "@/components/providers/project-provider";
import { ContractFilters } from "@/components/contracts/contract-filters";
import { ContractTable } from "@/components/contracts/contract-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { ContractListParams } from "@/lib/api/adapters/contracts-adapter";

const PAGE_SIZE = 10;

export default function AdminContractsPage() {
  return (
    <PermissionGuard
      permission="contracts:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState
            variant="forbidden"
            title="You don't have access to Contract Management"
            description="Ask an administrator for the contracts:read permission."
          />
        </div>
      }
    >
      <AdminContractsContent />
    </PermissionGuard>
  );
}

function AdminContractsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<ContractListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { status, error, result, refetch } = useContracts(filters);
  const { customers } = useCustomers();

  // BrickBasket "everything interconnected" connectivity fix: follow the
  // shared Global Project Selector until the user picks a project (or "All
  // projects") directly in this page's own filter — same pattern as
  // `GRNFilters`/`admin/documents/page.tsx`.
  const { selected } = useProjectContext();
  const userOverrodeProjectRef = useRef(false);
  useEffect(() => {
    if (userOverrodeProjectRef.current) return;
    if (selected) {
      setFilters((prev) => (prev.projectId === selected.id ? prev : { ...prev, projectId: selected.id }));
    }
  }, [selected]);
  const handleFiltersChange = (next: ContractListParams) => {
    if (next.projectId !== filters.projectId) userOverrodeProjectRef.current = true;
    setFilters(next);
  };

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as ContractListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Contract Management</h1>
          <p className="text-sm text-ink-muted">Line items, status, and acceptance history for every customer contract.</p>
        </div>
        <PermissionGuard permission="contracts:write">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.contracts}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New Contract
          </Button>
        </PermissionGuard>
      </div>

      <ContractFilters value={filters} customers={customers} onChange={handleFiltersChange} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load contracts" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No contracts match these filters" description="Try clearing a filter, or create a new contract." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <ContractTable
            contracts={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(contract) => router.push(`${ADMIN_ROUTES.contracts}/${contract.id}`)}
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

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { EmptyState } from "@/components/domain/empty-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useContracts } from "@/hooks/use-contracts";
import { useCustomers } from "@/hooks/use-customers";
import { useDocuments } from "@/hooks/use-documents";
import { ContractDirectoryFilters, type ContractDirectoryFilterValues } from "@/components/documents/contract-directory-filters";
import { ContractDirectoryTable } from "@/components/documents/contract-directory-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

const DIRECTORY_PAGE_SIZE = 200;

/**
 * Documents module landing page — owner corrections #1/#2/#6: no more
 * standalone "pick any project + category, upload" entry point. Instead
 * this is a "project list with contract reference number" (a Contract
 * Directory): every contract that exists, with its reference number, city,
 * type, and document count. Clicking a row goes to
 * `/admin/documents/[contractId]`, which is where upload and the
 * All Documents / Warranty Mapping toggle actually live — scoped to that
 * one contract, per correction #3 ("document uploading permission shall be
 * routed through respective contract only").
 */
export default function AdminDocumentsPage() {
  return (
    <PermissionGuard
      permission="documents:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Document Management" />
        </div>
      }
    >
      <AdminDocumentsDirectoryContent />
    </PermissionGuard>
  );
}

function AdminDocumentsDirectoryContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<ContractDirectoryFilterValues>({ search: "", city: "", contractCategory: "" });

  const { status: contractsStatus, error: contractsError, result: contractsResult, refetch } = useContracts({
    search: filters.search || undefined,
    page: 1,
    pageSize: DIRECTORY_PAGE_SIZE,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { customers } = useCustomers();
  const customersById = new Map(customers.map((c) => [c.id, c]));

  // Document counts per contract, for the directory table — a single
  // unfiltered, large-page fetch is simplest for a mock dataset this size;
  // a real backend would return counts via the contract list endpoint
  // itself rather than a second round trip. See docs/OPEN_QUESTIONS.md.
  const { result: allDocumentsResult } = useDocuments({ page: 1, pageSize: 500 });
  const documentCountsByContract = useMemo(() => {
    const counts = new Map<string, number>();
    for (const doc of allDocumentsResult?.items ?? []) {
      counts.set(doc.contractId, (counts.get(doc.contractId) ?? 0) + 1);
    }
    return counts;
  }, [allDocumentsResult]);

  const cities = useMemo(() => {
    const set = new Set((contractsResult?.items ?? []).map((c) => c.city).filter(Boolean));
    return [...set].sort();
  }, [contractsResult]);

  const filteredContracts = (contractsResult?.items ?? []).filter((c) => {
    if (filters.city && c.city !== filters.city) return false;
    if (filters.contractCategory && c.contractCategory !== filters.contractCategory) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Drawing & Document Management</h1>
        <p className="text-sm text-ink-muted">
          Every contract that can hold documents. Open a contract to view, filter, and upload its drawings,
          layouts, certificates, and warranty documents.
        </p>
      </div>

      <ContractDirectoryFilters value={filters} cities={cities} onChange={setFilters} />

      {contractsStatus === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {contractsStatus === "error" && (
        <ErrorState title="Could not load contracts" description={contractsError ?? undefined} onRetry={refetch} />
      )}

      {contractsStatus === "success" && filteredContracts.length === 0 && (
        <EmptyState title="No contracts match these filters" description="Try clearing a filter, or create a contract in Contract Management first." />
      )}

      {contractsStatus === "success" && filteredContracts.length > 0 && (
        <ContractDirectoryTable
          contracts={filteredContracts}
          customersById={customersById}
          documentCountsByContract={documentCountsByContract}
          onView={(contract) => router.push(`${ADMIN_ROUTES.documents}/${contract.id}`)}
        />
      )}
    </div>
  );
}

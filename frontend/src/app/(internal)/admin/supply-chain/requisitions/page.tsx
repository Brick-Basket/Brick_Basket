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
import { useRequisitions } from "@/hooks/use-requisitions";
import { useProjectContext } from "@/components/providers/project-provider";
import { RequisitionFilters } from "@/components/requisitions/requisition-filters";
import { RequisitionTable } from "@/components/requisitions/requisition-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { RequisitionListParams } from "@/lib/api/adapters/requisitions-adapter";

const PAGE_SIZE = 10;

/**
 * Document 2 "flow of channel" correction: this module is relabeled
 * "Supply/Service Requirement" in the UI (nav item, this page's H1, and
 * the global-search result label) — the owner's correction is that staff
 * confused this *pre-RFQ* requisition with the *post-GRN* "Material
 * Requisitions (MR)" module under Stores, since both showed up as
 * "Requisitions" in different places. The rename is scoped to exactly
 * those 3 display strings:
 *
 *   - `src/components/shell/nav-config.ts` — admin nav item label
 *   - this file's H1 (and the forbidden-fallback copy below)
 *   - `src/components/shell/global-search-config.ts` — `entityLabel`
 *
 * Deliberately NOT renamed: the `PurchaseRequisition`/`MaterialRequirement`
 * type names, the `/admin/supply-chain/requisitions` route path, the
 * `requisitionsAdapter`/`useRequisitions` hook/adapter names, the
 * `requisitions:*` permission keys, or any copy inside the detail/form/
 * table components (e.g. "Select a requisition…", "View source
 * requisition") — none of that is where the confusion the owner is
 * describing actually happens. Staff choose between modules at the nav/
 * search level; once inside this module there's no second "requisition"
 * concept on the same screen to confuse it with. A full rename of the
 * type/route/permission layer would carry real risk with no `tsc`
 * available in this environment to verify it, for no corresponding
 * benefit. See docs/OPEN_QUESTIONS.md #82.
 */
export default function AdminRequisitionsPage() {
  return (
    <PermissionGuard
      permission="requisitions:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Supply/Service Requirement" />
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
  const handleFiltersChange = (next: RequisitionListParams) => {
    if (next.projectId !== filters.projectId) userOverrodeProjectRef.current = true;
    setFilters(next);
  };

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
          <h1 className="font-heading text-2xl font-semibold text-ink">Supply/Service Requirement</h1>
          <p className="text-sm text-ink-muted">Raise material requirements against ACE rates for a project, or as additional free-entry items.</p>
        </div>
        <PermissionGuard permission="requisitions:create">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.requisitions}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New Requisition
          </Button>
        </PermissionGuard>
      </div>

      <RequisitionFilters value={filters} onChange={handleFiltersChange} />

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

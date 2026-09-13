"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useCostEntries } from "@/hooks/use-cost";
import { CostFilters } from "@/components/cost/cost-filters";
import { CostTable } from "@/components/cost/cost-table";
import { CostForm } from "@/components/cost/cost-form";
import { CostSummary } from "@/components/cost/cost-summary";
import type { CostEntry } from "@/types/domain/cost-entry";
import type { CostListParams } from "@/lib/api/adapters/cost-adapter";

const PAGE_SIZE = 10;

export default function AdminProjectCostPage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Project Cost Accounting" description="Ask an administrator for the finance:read permission." />
        </div>
      }
    >
      <AdminProjectCostContent />
    </PermissionGuard>
  );
}

function AdminProjectCostContent() {
  const canWrite = usePermission("finance:write");
  // Defaults to Modern Residence — the project with the fullest seeded
  // cost data (all 8 categories, mixing over/under/on-budget), same
  // "default to the fullest demo project" convention as the Schedule
  // page (Part 13). Any project can still be picked from the filter,
  // including one with no cost entries yet, to exercise the empty state.
  // BrickBasket final hardening pass (P2 mock import cleanup): a plain
  // default id, not a live lookup — no need to read `mockProjects` here.
  const [filters, setFilters] = useState<CostListParams>({
    projectId: "proj_modern_residence",
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "category",
    sortDir: "asc",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CostEntry | null>(null);
  const { status, error, result, refetch } = useCostEntries(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as CostListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Project Cost Accounting</h1>
          <p className="text-sm text-ink-muted">
            Budget vs. actual spend by category, with over/under indicators. Figures shown are illustrative demo data, not the owner&apos;s real numbers.
          </p>
        </div>
        <PermissionGuard permission="finance:write">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Cost Entry
          </Button>
        </PermissionGuard>
      </div>

      <CostFilters value={filters} onChange={setFilters} />

      {filters.projectId && <CostSummary projectId={filters.projectId} />}

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load cost entries" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No cost entries match these filters" description="Try clearing a filter, or add a new cost entry." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <CostTable
            entries={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={
              canWrite
                ? (entry) => {
                    setEditingEntry(entry);
                    setShowForm(true);
                  }
                : undefined
            }
          />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editingEntry ? "Edit Cost Entry" : "Add Cost Entry"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <CostForm
          mode={editingEntry ? "edit" : "create"}
          entry={editingEntry ?? undefined}
          onCancel={closeForm}
          onSuccess={() => {
            closeForm();
            refetch();
          }}
        />
      </Dialog>
    </div>
  );
}

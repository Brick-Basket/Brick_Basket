"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useStockEntries } from "@/hooks/use-stock";
import { useProjectContext } from "@/components/providers/project-provider";
import { StockFilters } from "@/components/stock/stock-filters";
import { StockTable } from "@/components/stock/stock-table";
import { StockForm } from "@/components/stock/stock-form";
import type { StockEntry } from "@/types/domain/stock-entry";
import type { StockListParams } from "@/lib/api/adapters/stock-adapter";

const PAGE_SIZE = 10;

export default function AdminStockPage() {
  return (
    <PermissionGuard
      permission="stock:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to the Stock Statement" />
        </div>
      }
    >
      <AdminStockContent />
    </PermissionGuard>
  );
}

function AdminStockContent() {
  const canWrite = usePermission("stock:write");
  const [filters, setFilters] = useState<StockListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "date", sortDir: "desc" });
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);

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
  const handleFiltersChange = (next: StockListParams) => {
    if (next.projectId !== filters.projectId) userOverrodeProjectRef.current = true;
    setFilters(next);
  };

  const { status, error, result, refetch } = useStockEntries(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as StockListParams["sortBy"],
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
          <h1 className="font-heading text-2xl font-semibold text-ink">Stock Statement</h1>
          <p className="text-sm text-ink-muted">Material, unit, opening/received/consumed/closing stock, supplier and remarks — per project, per day.</p>
        </div>
        <PermissionGuard permission="stock:write">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Entry
          </Button>
        </PermissionGuard>
      </div>

      <StockFilters value={filters} onChange={handleFiltersChange} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load the stock statement" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No stock entries match these filters" description="Try clearing a filter, or add a new entry." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <StockTable
            items={result.items}
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
        title={editingEntry ? "Edit Stock Entry" : "Add Stock Entry"}
        description="Read-only for roles without the stock:write permission — this dialog only opens for those who hold it."
      >
        <StockForm
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

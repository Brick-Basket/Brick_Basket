"use client";

import { useState } from "react";
import { LayoutGrid, Plus, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ErrorState } from "@/components/domain/error-state";
import { EmptyState } from "@/components/domain/empty-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useWastageEntries } from "@/hooks/use-wastage";
import { WastageFilters } from "@/components/wastage/wastage-filters";
import { WastageTable } from "@/components/wastage/wastage-table";
import { WastageSummary } from "@/components/wastage/wastage-summary";
import { WastageForm } from "@/components/wastage/wastage-form";
import type { WastageEntry } from "@/types/domain/wastage-entry";
import type { WastageListParams } from "@/lib/api/adapters/wastage-adapter";

type ViewMode = "detail" | "summary";

const PAGE_SIZE = 10;
const SUMMARY_PAGE_SIZE = 200;

/**
 * "Provide wastage summary/detail UI" per the owner requirements —
 * Detail is the full paginated entry list, Summary aggregates the whole
 * (unpaginated) result client-side by material (`WastageSummary`), same
 * toggle pattern as Document Management's Warranty Mapping view (Part 6).
 */
export default function AdminWastagePage() {
  return (
    <PermissionGuard
      permission="wastage:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Wastage" />
        </div>
      }
    >
      <AdminWastageContent />
    </PermissionGuard>
  );
}

function AdminWastageContent() {
  const canWrite = usePermission("wastage:write");
  const [view, setView] = useState<ViewMode>("detail");
  const [filters, setFilters] = useState<WastageListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "recordedAt", sortDir: "desc" });
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WastageEntry | null>(null);

  const listParams: WastageListParams = view === "detail" ? filters : { ...filters, page: 1, pageSize: SUMMARY_PAGE_SIZE };
  const { status, error, result, refetch } = useWastageEntries(listParams);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as WastageListParams["sortBy"],
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
          <h1 className="font-heading text-2xl font-semibold text-ink">Wastage</h1>
          <p className="text-sm text-ink-muted">Materials procured above defined scope, categorized as wastage with quantity and value.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5">
            <Button variant={view === "detail" ? "secondary" : "ghost"} size="sm" onClick={() => setView("detail")} aria-pressed={view === "detail"}>
              <TableIcon className="h-4 w-4" aria-hidden />
              Detail
            </Button>
            <Button variant={view === "summary" ? "secondary" : "ghost"} size="sm" onClick={() => setView("summary")} aria-pressed={view === "summary"}>
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Summary
            </Button>
          </div>
          <PermissionGuard permission="wastage:write">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Log Wastage
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <WastageFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load wastage entries" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && view === "detail" && (
        <EmptyState title="No wastage entries match these filters" description="Try clearing a filter, or log a new entry." />
      )}

      {status === "success" && result && view === "detail" && result.items.length > 0 && (
        <>
          <WastageTable
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

      {status === "success" && result && view === "summary" && <WastageSummary entries={result.items} />}

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editingEntry ? "Edit Wastage Entry" : "Log Wastage"}
        description="Read-only for roles without the wastage:write permission — this dialog only opens for those who hold it."
      >
        <WastageForm
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

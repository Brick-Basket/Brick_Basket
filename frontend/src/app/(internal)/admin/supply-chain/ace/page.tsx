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
import { useACEItems } from "@/hooks/use-ace";
import { ACEFilters } from "@/components/ace/ace-filters";
import { ACETable } from "@/components/ace/ace-table";
import { ACEForm } from "@/components/ace/ace-form";
import type { ACEItem } from "@/types/domain/ace-item";
import type { ACEListParams } from "@/lib/api/adapters/ace-adapter";

const PAGE_SIZE = 10;

export default function AdminACEPage() {
  return (
    <PermissionGuard
      permission="ace:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Accepted Cost Estimate" />
        </div>
      }
    >
      <AdminACEContent />
    </PermissionGuard>
  );
}

function AdminACEContent() {
  const canWrite = usePermission("ace:write");
  const [filters, setFilters] = useState<ACEListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "itemDescription", sortDir: "asc" });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ACEItem | null>(null);
  const { status, error, result, refetch } = useACEItems(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as ACEListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Accepted Cost Estimate</h1>
          <p className="text-sm text-ink-muted">Predefined workable rates by work category, set per project before work starts.</p>
        </div>
        <PermissionGuard permission="ace:write">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Rate
          </Button>
        </PermissionGuard>
      </div>

      <ACEFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load ACE items" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No ACE items match these filters" description="Try clearing a filter, or add a new rate." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <ACETable
            items={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={
              canWrite
                ? (item) => {
                    setEditingItem(item);
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
        title={editingItem ? "Edit ACE Rate" : "Add ACE Rate"}
        description="Read-only for roles without the ace:write permission — this dialog only opens for those who hold it."
      >
        <ACEForm
          mode={editingItem ? "edit" : "create"}
          item={editingItem ?? undefined}
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

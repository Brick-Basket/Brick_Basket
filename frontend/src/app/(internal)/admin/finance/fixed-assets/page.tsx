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
import { useFixedAssets } from "@/hooks/use-fixed-assets";
import { FixedAssetFilters } from "@/components/finance/fixed-asset-filters";
import { FixedAssetTable } from "@/components/finance/fixed-asset-table";
import { FixedAssetForm } from "@/components/finance/fixed-asset-form";
import { FIXED_ASSET_MIN_VALUE } from "@/components/finance/fixed-asset-config";
import type { FixedAsset } from "@/types/domain/fixed-asset";
import type { FixedAssetListParams } from "@/lib/api/adapters/fixed-assets-adapter";

const PAGE_SIZE = 10;

/**
 * "Assets under organization with individual value above ₹5,000" (§8E) —
 * the one owner-confirmed rule is the value threshold
 * (`FIXED_ASSET_MIN_VALUE`); category vocabulary and the disposed
 * lifecycle are frontend inventions (see `types/domain/fixed-asset.ts`).
 */
export default function AdminFixedAssetsPage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Fixed Assets" description="Ask an administrator for the finance:read permission." />
        </div>
      }
    >
      <AdminFixedAssetsContent />
    </PermissionGuard>
  );
}

function AdminFixedAssetsContent() {
  const canWrite = usePermission("finance:write");
  const [filters, setFilters] = useState<FixedAssetListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "purchaseDate", sortDir: "desc" });
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const { status, error, result, refetch } = useFixedAssets(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as FixedAssetListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Fixed Assets</h1>
          <p className="text-sm text-ink-muted">
            Organization assets valued above ₹{FIXED_ASSET_MIN_VALUE.toLocaleString("en-IN")}. Optionally linked to a vendor and/or project.
          </p>
        </div>
        <PermissionGuard permission="finance:write">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Asset
          </Button>
        </PermissionGuard>
      </div>

      <FixedAssetFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load fixed assets" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No fixed assets match these filters" description="Try clearing a filter, or add a new asset." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <FixedAssetTable
            assets={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={
              canWrite
                ? (asset) => {
                    setEditingAsset(asset);
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
        title={editingAsset ? "Edit Asset" : "Add Asset"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <FixedAssetForm
          mode={editingAsset ? "edit" : "create"}
          asset={editingAsset ?? undefined}
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

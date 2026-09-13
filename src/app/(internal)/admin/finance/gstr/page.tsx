"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useGSTRRecords } from "@/hooks/use-gstr";
import { GSTRFilters } from "@/components/finance/gstr-filters";
import { GSTRTable } from "@/components/finance/gstr-table";
import { GSTRForm } from "@/components/finance/gstr-form";
import { getTotalTax, getTotalTaxableValue } from "@/components/finance/gstr-math";
import { formatINR } from "@/lib/utils/format";
import type { GSTRRecord, GSTRRecordType } from "@/types/domain/gstr-record";
import type { GSTRListParams } from "@/lib/api/adapters/gstr-adapter";

type Tab = GSTRRecordType;

const PAGE_SIZE = 10;

/**
 * "Two categories: Purchase — purchases inclusive of taxes after stores
 * GRN... Sales — all business sales including constructed house and
 * materials, if any." (§8F) — one route, two tabs pinning `type` in the
 * list params, the same Detail/Summary toggle mechanic reused for
 * Payments & Receipts (Part 16).
 */
export default function AdminGSTRPage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to GSTR Financial Reporting" description="Ask an administrator for the finance:read permission." />
        </div>
      }
    >
      <AdminGSTRContent />
    </PermissionGuard>
  );
}

function AdminGSTRContent() {
  const canWrite = usePermission("finance:write");
  const [tab, setTab] = useState<Tab>("purchase");

  const [purchaseFilters, setPurchaseFilters] = useState<GSTRListParams>({ type: "purchase", page: 1, pageSize: PAGE_SIZE, sortBy: "period", sortDir: "desc" });
  const [salesFilters, setSalesFilters] = useState<GSTRListParams>({ type: "sales", page: 1, pageSize: PAGE_SIZE, sortBy: "period", sortDir: "desc" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GSTRRecord | null>(null);

  const purchaseQuery = useGSTRRecords(purchaseFilters);
  const salesQuery = useGSTRRecords(salesFilters);
  const activeQuery = tab === "purchase" ? purchaseQuery : salesQuery;
  const activeFilters = tab === "purchase" ? purchaseFilters : salesFilters;
  const setActiveFilters = tab === "purchase" ? setPurchaseFilters : setSalesFilters;

  const handleSortChange = (key: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      sortBy: key as GSTRListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const items = activeQuery.result?.items ?? [];
  const totalTaxableValue = getTotalTaxableValue(items);
  const totalTax = getTotalTax(items);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">GSTR Financial Reporting</h1>
          <p className="text-sm text-ink-muted">Purchases (inclusive of taxes, after stores GRN) and sales — including constructed house and materials — by return period.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-border p-0.5">
            <Button variant={tab === "purchase" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("purchase")} aria-pressed={tab === "purchase"}>
              <ArrowDownToLine className="h-4 w-4" aria-hidden />
              Purchase
            </Button>
            <Button variant={tab === "sales" ? "secondary" : "ghost"} size="sm" onClick={() => setTab("sales")} aria-pressed={tab === "sales"}>
              <ArrowUpFromLine className="h-4 w-4" aria-hidden />
              Sales
            </Button>
          </div>
          <PermissionGuard permission="finance:write">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add Entry
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {activeQuery.status === "success" && items.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Taxable Value (this page)</p>
            <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(totalTaxableValue)}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Tax (this page)</p>
            <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(totalTax)}</p>
          </div>
        </div>
      )}

      <GSTRFilters value={activeFilters} onChange={setActiveFilters} />

      {activeQuery.status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {activeQuery.status === "error" && (
        <ErrorState title="Could not load GSTR records" description={activeQuery.error ?? undefined} onRetry={activeQuery.refetch} />
      )}

      {activeQuery.status === "success" && activeQuery.result && activeQuery.result.items.length === 0 && (
        <EmptyState title={`No ${tab} records match these filters`} description="Try clearing a filter, or add a new entry." />
      )}

      {activeQuery.status === "success" && activeQuery.result && activeQuery.result.items.length > 0 && (
        <>
          <GSTRTable
            records={activeQuery.result.items}
            sortBy={activeFilters.sortBy}
            sortDir={activeFilters.sortDir}
            onSortChange={handleSortChange}
            onView={
              canWrite
                ? (record) => {
                    setEditingRecord(record);
                    setShowForm(true);
                  }
                : undefined
            }
          />
          <Pagination
            page={activeQuery.result.page}
            pageSize={activeQuery.result.pageSize}
            total={activeQuery.result.total}
            onPageChange={(page) => setActiveFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editingRecord ? "Edit Entry" : tab === "purchase" ? "Add Purchase Entry" : "Add Sales Entry"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <GSTRForm
          type={editingRecord?.type ?? tab}
          mode={editingRecord ? "edit" : "create"}
          record={editingRecord ?? undefined}
          onCancel={closeForm}
          onSuccess={() => {
            closeForm();
            activeQuery.refetch();
          }}
        />
      </Dialog>
    </div>
  );
}

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
import { useTaxRecords } from "@/hooks/use-tax-records";
import { TaxRecordFilters } from "@/components/finance/tax-record-filters";
import { TaxRecordTable } from "@/components/finance/tax-record-table";
import { TaxRecordForm } from "@/components/finance/tax-record-form";
import { getTotalOverdue, getTotalPending } from "@/components/finance/tax-record-math";
import { formatINR } from "@/lib/utils/format";
import type { TaxRecord } from "@/types/domain/tax-record";
import type { TaxRecordListParams } from "@/lib/api/adapters/tax-records-adapter";

const PAGE_SIZE = 10;

/**
 * "Government taxes and statutory license fees" (§8D) — the owner text
 * names the module's scope and nothing else, so this is modeled as a flat,
 * fully-editable ledger (see `types/domain/tax-record.ts`), the same
 * no-locked-identity shape `BankTransaction` uses (Part 16).
 */
export default function AdminTaxesPage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Taxes & Statutory Accounting" description="Ask an administrator for the finance:read permission." />
        </div>
      }
    >
      <AdminTaxesContent />
    </PermissionGuard>
  );
}

function AdminTaxesContent() {
  const canWrite = usePermission("finance:write");
  const [filters, setFilters] = useState<TaxRecordListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "dueDate", sortDir: "asc" });
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TaxRecord | null>(null);
  const { status, error, result, refetch } = useTaxRecords(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as TaxRecordListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const allRecords = result?.items ?? [];
  const totalPending = getTotalPending(allRecords);
  const totalOverdue = getTotalOverdue(allRecords);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Taxes & Statutory Accounting</h1>
          <p className="text-sm text-ink-muted">Government taxes and statutory license fees. Status is computed from the due/paid dates, never stored.</p>
        </div>
        <PermissionGuard permission="finance:write">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Tax Record
          </Button>
        </PermissionGuard>
      </div>

      {status === "success" && allRecords.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Pending (this page)</p>
            <p className="mt-1 font-heading text-xl font-semibold text-warning">{formatINR(totalPending)}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Overdue (this page)</p>
            <p className="mt-1 font-heading text-xl font-semibold text-error">{formatINR(totalOverdue)}</p>
          </div>
        </div>
      )}

      <TaxRecordFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load tax records" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No tax records match these filters" description="Try clearing a filter, or add a new tax record." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <TaxRecordTable
            records={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
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
        title={editingRecord ? "Edit Tax Record" : "Add Tax Record"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <TaxRecordForm
          mode={editingRecord ? "edit" : "create"}
          record={editingRecord ?? undefined}
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

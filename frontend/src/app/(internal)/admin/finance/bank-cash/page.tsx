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
import { useBankTransactions } from "@/hooks/use-bank-transactions";
import { BankTransactionFilters } from "@/components/bank/bank-transaction-filters";
import { BankTransactionTable } from "@/components/bank/bank-transaction-table";
import { BankTransactionForm } from "@/components/bank/bank-transaction-form";
import type { BankTransaction } from "@/types/domain/bank-transaction";
import type { BankTransactionListParams } from "@/lib/api/adapters/bank-adapter";

const PAGE_SIZE = 10;

/**
 * "Prepare fields for" (§8C) — a single list-plus-Dialog page, the ACE/
 * Stock/Wastage/CostEntry pattern, since the owner's ask here is a flat
 * field set to capture, not a workflow. See `bank-transaction.ts`'s
 * header comment for what each field maps to.
 */
export default function AdminBankCashPage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Bank & Cash Management" description="Ask an administrator for the finance:read permission." />
        </div>
      }
    >
      <AdminBankCashContent />
    </PermissionGuard>
  );
}

function AdminBankCashContent() {
  const canWrite = usePermission("finance:write");
  const [filters, setFilters] = useState<BankTransactionListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "createdAt", sortDir: "desc" });
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const { status, error, result, refetch } = useBankTransactions(filters);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as BankTransactionListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Bank & Cash Management</h1>
          <p className="text-sm text-ink-muted">Party/vendor code, account and UTR, project and location, and tax/TDS/GSTIN/ITC fields for each bank or cash movement.</p>
        </div>
        <PermissionGuard permission="finance:write">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Entry
          </Button>
        </PermissionGuard>
      </div>

      <BankTransactionFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load bank & cash entries" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No entries match these filters" description="Try clearing a filter, or add a new entry." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <BankTransactionTable
            transactions={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={
              canWrite
                ? (transaction) => {
                    setEditingTransaction(transaction);
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
        title={editingTransaction ? "Edit Bank & Cash Entry" : "Add Bank & Cash Entry"}
        description="Read-only for roles without the finance:write permission — this dialog only opens for those who hold it."
      >
        <BankTransactionForm
          mode={editingTransaction ? "edit" : "create"}
          transaction={editingTransaction ?? undefined}
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

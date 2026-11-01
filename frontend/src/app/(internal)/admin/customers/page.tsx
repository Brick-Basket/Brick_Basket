"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCustomers } from "@/hooks/use-customers";
import { CustomerFilters, type CustomerFiltersValue } from "@/components/customers/customer-filters";
import { CustomerTable } from "@/components/customers/customer-table";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { Customer } from "@/types/domain/customer";

const PAGE_SIZE = 10;

export default function AdminCustomersPage() {
  return (
    <PermissionGuard
      permission="customers:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to the Customer Module" />
        </div>
      }
    >
      <AdminCustomersContent />
    </PermissionGuard>
  );
}

function AdminCustomersContent() {
  const router = useRouter();
  const { status, error, customers, refetch } = useCustomers();
  const [filtersValue, setFiltersValue] = useState<CustomerFiltersValue>({});
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // CustomersAdapter.list() takes no params (see its doc comment) — unlike
  // Vendors, filtering/sorting/pagination for this list happens client-side
  // over the already-fetched array. Fine at today's data volume; flagged in
  // docs/OPEN_QUESTIONS.md as a follow-up if a real backend paginates this.
  const filteredSorted = useMemo(() => {
    let items = [...customers];

    if (filtersValue.source === "lead") items = items.filter((c) => !!c.leadId);
    if (filtersValue.source === "direct") items = items.filter((c) => !c.leadId);
    if (filtersValue.search) {
      const q = filtersValue.search.trim().toLowerCase();
      items = items.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
      );
    }

    items.sort((a, b) => {
      const av = a[sortBy as keyof Customer] ?? "";
      const bv = b[sortBy as keyof Customer] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return items;
  }, [customers, filtersValue, sortBy, sortDir]);

  const total = filteredSorted.length;
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filteredSorted.slice(start, start + PAGE_SIZE);

  const handleFiltersChange = (next: CustomerFiltersValue) => {
    setFiltersValue(next);
    setPage(1);
  };

  const handleSortChange = (key: string) => {
    if (sortBy === key) {
      setSortDir((prevDir) => (prevDir === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-ink-muted">Customer profiles, payments, and project progress — see docs/MODULES.md.</p>
        </div>
        <PermissionGuard permission="customers:write">
          <Button onClick={() => router.push(`${ADMIN_ROUTES.customers}/new`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New Customer
          </Button>
        </PermissionGuard>
      </div>

      <CustomerFilters value={filtersValue} onChange={handleFiltersChange} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load customers" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && total === 0 && (
        <EmptyState title="No customers match these filters" description="Try clearing a filter, or add a new customer." />
      )}

      {status === "success" && total > 0 && (
        <>
          <CustomerTable
            customers={pageItems}
            sortBy={sortBy}
            sortDir={sortDir}
            onSortChange={handleSortChange}
            onView={(customer) => router.push(`${ADMIN_ROUTES.customers}/${customer.id}`)}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

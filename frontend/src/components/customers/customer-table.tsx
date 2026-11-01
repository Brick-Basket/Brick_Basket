"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { formatDate } from "@/lib/utils/format";
import type { Customer } from "@/types/domain/customer";

export function CustomerTable({
  customers,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  customers: Customer[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (customer: Customer) => void;
}) {
  const columns: DataTableColumn<Customer>[] = [
    {
      key: "name",
      header: "Customer",
      sortKey: "name",
      render: (c) => (
        <div>
          <p className="font-medium text-ink">{c.name}</p>
          <p className="text-xs text-ink-muted">{c.email}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (c) => c.phone,
    },
    {
      key: "source",
      header: "Source",
      hideOnMobile: true,
      render: (c) => <Badge variant={c.leadId ? "brand" : "neutral"}>{c.leadId ? "From Lead" : "Direct"}</Badge>,
    },
    {
      key: "createdAt",
      header: "Added",
      sortKey: "createdAt",
      hideOnMobile: true,
      render: (c) => formatDate(c.createdAt),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={customers}
      keyFor={(c) => c.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
    />
  );
}

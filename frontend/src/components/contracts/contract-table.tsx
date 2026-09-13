"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { StatusBadge } from "@/components/domain/status-badge";
import { formatDate, formatINR } from "@/lib/utils/format";
import { CONTRACT_STATUS_CONFIG } from "@/components/contracts/contract-status-config";
import type { Contract } from "@/types/domain/contract";
import type { Customer } from "@/types/domain/customer";

export function ContractTable({
  contracts,
  customersById,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  contracts: Contract[];
  customersById: Map<string, Customer>;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (contract: Contract) => void;
}) {
  const columns: DataTableColumn<Contract>[] = [
    {
      key: "contractNumber",
      header: "Contract",
      render: (c) => (
        <div>
          <p className="font-medium text-ink">{c.contractNumber}</p>
          <p className="text-xs text-ink-muted">{c.title}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (c) => customersById.get(c.customerId)?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (c) => <StatusBadge status={c.status} config={CONTRACT_STATUS_CONFIG} />,
    },
    {
      key: "value",
      header: "Value",
      render: (c) => formatINR(c.lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0)),
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      render: (c) => formatDate(c.createdAt),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={contracts}
      keyFor={(c) => c.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
    />
  );
}

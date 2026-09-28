"use client";

import { FileText } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_CATEGORY_TYPE_CONFIG } from "@/components/contracts/contract-category-type-config";
import { formatDate } from "@/lib/utils/format";
import type { Contract } from "@/types/domain/contract";
import type { Customer } from "@/types/domain/customer";

/**
 * "Project list with contract reference number" the Documents module needs
 * (owner correction #6) — one row per contract, click through to that
 * contract's own documents/warranty-mapping view
 * (`/admin/documents/[contractId]`). This is the Documents module's own
 * contract directory — a read-focused subset of `ContractTable`
 * (Contract Management), not a duplicate of it.
 */
export function ContractDirectoryTable({
  contracts,
  customersById,
  documentCountsByContract,
  onView,
}: {
  contracts: Contract[];
  customersById: Map<string, Customer>;
  documentCountsByContract: Map<string, number>;
  onView: (contract: Contract) => void;
}) {
  const columns: DataTableColumn<Contract>[] = [
    {
      key: "contractNumber",
      header: "Contract Reference",
      render: (c) => (
        <div>
          <p className="font-medium text-ink">{c.contractNumber}</p>
          <p className="text-xs text-ink-muted">{c.title}</p>
        </div>
      ),
    },
    {
      key: "city",
      header: "City",
      render: (c) => (
        <span>
          {c.city}
          {c.state ? `, ${c.state}` : ""}
        </span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      hideOnMobile: true,
      render: (c) => customersById.get(c.customerId)?.name ?? "—",
    },
    {
      key: "contractCategory",
      header: "Type",
      render: (c) => <Badge variant="neutral">{CONTRACT_CATEGORY_TYPE_CONFIG[c.contractCategory].label}</Badge>,
    },
    {
      key: "documents",
      header: "Documents",
      render: (c) => (
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
          {documentCountsByContract.get(c.id) ?? 0}
        </span>
      ),
    },
    {
      key: "contractDate",
      header: "Date",
      hideOnMobile: true,
      render: (c) => (c.contractDate ? formatDate(c.contractDate) : "—"),
    },
  ];

  return <DataTable columns={columns} rows={contracts} keyFor={(c) => c.id} onRowClick={onView} />;
}

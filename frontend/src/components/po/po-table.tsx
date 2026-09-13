"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { StatusBadge } from "@/components/domain/status-badge";
import { PO_STATUS_CONFIG } from "@/components/po/po-status-config";
import { formatDate } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import type { PurchaseOrder } from "@/types/domain/purchase-order";

export function POTable({
  purchaseOrders,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  purchaseOrders: PurchaseOrder[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (po: PurchaseOrder) => void;
}) {
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const columns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: "poNumber",
      header: "PO #",
      sortKey: "poNumber",
      render: (p) => <span className="font-medium text-ink">{p.poNumber}</span>,
    },
    {
      key: "project",
      header: "Project",
      render: (p) => allProjects.find((proj) => proj.id === p.projectId)?.name ?? "—",
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (p) => allVendors.find((v) => v.id === p.vendorId)?.tradeName ?? "—",
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (p) => <StatusBadge status={p.status} config={PO_STATUS_CONFIG} />,
    },
    {
      key: "preparedByName",
      header: "Prepared By",
      hideOnMobile: true,
      render: (p) => p.preparedByName,
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      render: (p) => formatDate(p.createdAt),
    },
  ];

  return (
    <DataTable columns={columns} rows={purchaseOrders} keyFor={(p) => p.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

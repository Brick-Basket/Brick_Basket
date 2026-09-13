"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { formatDate } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import type { GRN } from "@/types/domain/grn";

export function GRNTable({
  items,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  items: GRN[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView?: (grn: GRN) => void;
}) {
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const columns: DataTableColumn<GRN>[] = [
    {
      key: "grnNumber",
      header: "GRN #",
      sortKey: "grnNumber",
      render: (g) => <p className="font-medium text-ink">{g.grnNumber}</p>,
    },
    {
      key: "project",
      header: "Project",
      render: (g) => allProjects.find((p) => p.id === g.projectId)?.name ?? "—",
    },
    {
      key: "vendor",
      header: "Vendor",
      hideOnMobile: true,
      render: (g) => allVendors.find((v) => v.id === g.vendorId)?.tradeName ?? "—",
    },
    {
      key: "purchaseOrderId",
      header: "Purchase Order",
      hideOnMobile: true,
      render: (g) => g.purchaseOrderId,
    },
    {
      key: "receivedAt",
      header: "Received",
      sortKey: "receivedAt",
      render: (g) => formatDate(g.receivedAt),
    },
  ];

  return (
    <DataTable columns={columns} rows={items} keyFor={(g) => g.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { StatusBadge } from "@/components/domain/status-badge";
import { formatDate } from "@/lib/utils/format";
import { MRC_STATUS_CONFIG } from "@/components/mrc/mrc-status-config";
import { useProjects } from "@/hooks/use-projects";
import type { MRC } from "@/types/domain/mrc";
import type { Customer } from "@/types/domain/customer";

export function MRCTable({
  mrcs,
  customersById,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  mrcs: MRC[];
  customersById: Map<string, Customer>;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (mrc: MRC) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<MRC>[] = [
    {
      key: "mrcNumber",
      header: "MRC",
      render: (m) => <p className="font-medium text-ink">{m.mrcNumber}</p>,
    },
    {
      key: "customer",
      header: "Customer",
      render: (m) => customersById.get(m.customerId)?.name ?? "—",
    },
    {
      key: "project",
      header: "Project",
      render: (m) => (m.projectId ? allProjects.find((p) => p.id === m.projectId)?.name ?? "—" : "—"),
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (m) => <StatusBadge status={m.status} config={MRC_STATUS_CONFIG} />,
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      render: (m) => formatDate(m.createdAt),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={mrcs}
      keyFor={(m) => m.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
    />
  );
}

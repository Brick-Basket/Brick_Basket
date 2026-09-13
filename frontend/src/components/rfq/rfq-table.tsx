"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { StatusBadge } from "@/components/domain/status-badge";
import { RFQ_STATUS_CONFIG } from "@/components/rfq/rfq-status-config";
import { formatDate } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { RFQ } from "@/types/domain/rfq";

export function RFQTable({
  rfqs,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  rfqs: RFQ[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (rfq: RFQ) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<RFQ>[] = [
    {
      key: "rfqNumber",
      header: "RFQ #",
      sortKey: "rfqNumber",
      render: (r) => <span className="font-medium text-ink">{r.rfqNumber}</span>,
    },
    {
      key: "project",
      header: "Project",
      render: (r) => allProjects.find((p) => p.id === r.projectId)?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (r) => <StatusBadge status={r.status} config={RFQ_STATUS_CONFIG} />,
    },
    {
      key: "preparedByName",
      header: "Prepared By",
      hideOnMobile: true,
      render: (r) => r.preparedByName,
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return <DataTable columns={columns} rows={rfqs} keyFor={(r) => r.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />;
}

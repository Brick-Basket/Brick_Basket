"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { StatusBadge } from "@/components/domain/status-badge";
import { REQUISITION_STATUS_CONFIG } from "@/components/requisitions/requisition-status-config";
import { formatDate } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { PurchaseRequisition } from "@/types/domain/requisition";

export function RequisitionTable({
  requisitions,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  requisitions: PurchaseRequisition[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (requisition: PurchaseRequisition) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<PurchaseRequisition>[] = [
    {
      key: "requisitionNumber",
      header: "Requisition",
      sortKey: "requisitionNumber",
      render: (r) => (
        <div>
          <p className="font-medium text-ink">{r.requisitionNumber}</p>
          <p className="text-xs text-ink-muted">{r.requestedByName}</p>
        </div>
      ),
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
      render: (r) => <StatusBadge status={r.status} config={REQUISITION_STATUS_CONFIG} />,
    },
    {
      key: "createdAt",
      header: "Created",
      sortKey: "createdAt",
      render: (r) => formatDate(r.createdAt),
    },
  ];

  return (
    <DataTable columns={columns} rows={requisitions} keyFor={(r) => r.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

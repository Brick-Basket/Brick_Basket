"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { StatusBadge } from "@/components/domain/status-badge";
import { useProjects } from "@/hooks/use-projects";
import { STORE_REQUISITION_STATUS_CONFIG } from "@/components/store-requisitions/store-requisition-status-config";
import { stockMaterialLabel } from "@/components/stock/stock-material-config";
import { formatDate } from "@/lib/utils/format";
import type { StoreRequisition } from "@/types/domain/store-requisition";

export function StoreRequisitionTable({
  requisitions,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  requisitions: StoreRequisition[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView: (requisition: StoreRequisition) => void;
}) {
  // One list call here, not a `useProject(id)` call inside a per-row
  // callback (which would violate the Rules of Hooks) — see the identical
  // pattern in `/dashboard/mrc/page.tsx`.
  const { projects } = useProjects();

  const columns: DataTableColumn<StoreRequisition>[] = [
    {
      key: "requisitionNumber",
      header: "Request",
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
      render: (r) => projects.find((p) => p.id === r.projectId)?.name ?? "—",
    },
    {
      key: "material",
      header: "Material",
      render: (r) => stockMaterialLabel(r.material, r.otherMaterialName),
    },
    {
      key: "quantity",
      header: "Requested Qty.",
      render: (r) => `${r.requestedQuantity} ${r.uom}`,
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      render: (r) => <StatusBadge status={r.status} config={STORE_REQUISITION_STATUS_CONFIG} />,
    },
    {
      key: "requestDate",
      header: "Requested",
      sortKey: "requestDate",
      render: (r) => formatDate(r.requestDate),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={requisitions}
      keyFor={(r) => r.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onRowClick={onView}
    />
  );
}

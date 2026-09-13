"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { stockMaterialLabel } from "@/components/stock/stock-material-config";
import { formatDate, formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { WastageEntry } from "@/types/domain/wastage-entry";

/** The "detail" half of the required summary/detail UI — one row per logged wastage entry. */
export function WastageTable({
  items,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  items: WastageEntry[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView?: (entry: WastageEntry) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<WastageEntry>[] = [
    {
      key: "material",
      header: "Material",
      render: (e) => (
        <div>
          <p className="font-medium text-ink">{stockMaterialLabel(e.material, e.otherMaterialName)}</p>
          {e.reason && <p className="text-xs text-ink-muted">{e.reason}</p>}
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (e) => allProjects.find((p) => p.id === e.projectId)?.name ?? "—",
    },
    {
      key: "recordedAt",
      header: "Recorded",
      sortKey: "recordedAt",
      render: (e) => formatDate(e.recordedAt),
    },
    {
      key: "quantity",
      header: "Quantity",
      sortKey: "quantity",
      render: (e) => `${e.quantity.toLocaleString("en-IN")} ${e.uom}`,
    },
    {
      key: "value",
      header: "Value",
      sortKey: "value",
      render: (e) => formatINR(e.value),
    },
  ];

  return (
    <DataTable columns={columns} rows={items} keyFor={(e) => e.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

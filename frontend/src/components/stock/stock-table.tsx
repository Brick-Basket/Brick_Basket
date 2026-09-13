"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { stockMaterialLabel } from "@/components/stock/stock-material-config";
import { formatDate } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { StockEntry } from "@/types/domain/stock-entry";

/** Closing stock (`opening + received − consumed`) is always computed here, never stored on `StockEntry`. */
export function StockTable({
  items,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  items: StockEntry[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView?: (entry: StockEntry) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<StockEntry>[] = [
    {
      key: "material",
      header: "Material",
      sortKey: "material",
      render: (e) => <p className="font-medium text-ink">{stockMaterialLabel(e.material, e.otherMaterialName)}</p>,
    },
    {
      key: "project",
      header: "Project",
      render: (e) => allProjects.find((p) => p.id === e.projectId)?.name ?? "—",
    },
    {
      key: "date",
      header: "Date",
      sortKey: "date",
      render: (e) => formatDate(e.date),
    },
    { key: "uom", header: "Unit", hideOnMobile: true, render: (e) => e.uom },
    { key: "openingStock", header: "Opening", hideOnMobile: true, render: (e) => e.openingStock.toLocaleString("en-IN") },
    { key: "receivedToday", header: "Received Today", render: (e) => e.receivedToday.toLocaleString("en-IN") },
    { key: "consumedToday", header: "Consumed Today", render: (e) => e.consumedToday.toLocaleString("en-IN") },
    {
      key: "closingStock",
      header: "Closing",
      render: (e) => {
        const closing = e.openingStock + e.receivedToday - e.consumedToday;
        return <span className={closing <= 0 ? "font-medium text-warning" : "font-medium text-ink"}>{closing.toLocaleString("en-IN")}</span>;
      },
    },
    { key: "supplier", header: "Supplier", hideOnMobile: true, render: (e) => e.supplierName ?? "—" },
  ];

  return (
    <DataTable columns={columns} rows={items} keyFor={(e) => e.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

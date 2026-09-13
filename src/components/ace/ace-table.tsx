"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { CONTRACT_CATEGORY_CONFIG } from "@/components/contracts/contract-category-config";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { ACEItem } from "@/types/domain/ace-item";

export function ACETable({
  items,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  items: ACEItem[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (item: ACEItem) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<ACEItem>[] = [
    {
      key: "itemDescription",
      header: "Item",
      sortKey: "itemDescription",
      render: (i) => (
        <div>
          <p className="font-medium text-ink">{i.itemDescription}</p>
          {i.notes && <p className="text-xs text-ink-muted">{i.notes}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (i) => CONTRACT_CATEGORY_CONFIG[i.category].label,
    },
    {
      key: "project",
      header: "Project",
      render: (i) => allProjects.find((p) => p.id === i.projectId)?.name ?? "—",
    },
    {
      key: "uom",
      header: "UOM",
      hideOnMobile: true,
      render: (i) => i.uom,
    },
    {
      key: "rate",
      header: "Rate",
      sortKey: "rate",
      render: (i) => `${formatINR(i.rate)} / ${i.uom}`,
    },
  ];

  return (
    <DataTable columns={columns} rows={items} keyFor={(i) => i.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import type { MaterialRequirement } from "@/types/domain/requisition";

/** Read-only requirement lines for the requisition detail page. */
export function MaterialRequirementTable({ lines }: { lines: MaterialRequirement[] }) {
  const columns: DataTableColumn<MaterialRequirement>[] = [
    {
      key: "description",
      header: "Item",
      render: (l) => (
        <div>
          <p className="font-medium text-ink">{l.description}</p>
          {l.brand && <p className="text-xs text-ink-muted">Brand: {l.brand}</p>}
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (l) => <Badge variant={l.source === "predefined" ? "brand" : "neutral"}>{l.source === "predefined" ? "Predefined (ACE)" : "Additional"}</Badge>,
    },
    {
      key: "uom",
      header: "UOM",
      hideOnMobile: true,
      render: (l) => l.uom,
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (l) => l.quantity,
    },
  ];

  return <DataTable columns={columns} rows={lines} keyFor={(l) => l.id} />;
}

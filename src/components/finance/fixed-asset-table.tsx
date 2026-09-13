"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { FIXED_ASSET_CATEGORY_CONFIG, FIXED_ASSET_STATUS_CONFIG } from "@/components/finance/fixed-asset-config";
import { formatDate, formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { FixedAsset } from "@/types/domain/fixed-asset";

export function FixedAssetTable({
  assets,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  assets: FixedAsset[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (asset: FixedAsset) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<FixedAsset>[] = [
    {
      key: "assetName",
      header: "Asset",
      render: (a) => (
        <div>
          <p className="font-medium text-ink">{a.assetName}</p>
          {a.serialNumber && <p className="text-xs text-ink-muted">{a.serialNumber}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideOnMobile: true,
      render: (a) => <Badge variant="neutral">{FIXED_ASSET_CATEGORY_CONFIG[a.category].label}</Badge>,
    },
    {
      key: "project",
      header: "Project",
      hideOnMobile: true,
      render: (a) => (a.projectId ? allProjects.find((p) => p.id === a.projectId)?.name ?? "—" : "Organization-wide"),
    },
    {
      key: "purchaseDate",
      header: "Purchase Date",
      sortKey: "purchaseDate",
      render: (a) => formatDate(`${a.purchaseDate}T00:00:00.000Z`),
    },
    {
      key: "value",
      header: "Value",
      sortKey: "value",
      render: (a) => formatINR(a.value),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => {
        const { label, variant } = FIXED_ASSET_STATUS_CONFIG[a.status];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
  ];

  return (
    <DataTable columns={columns} rows={assets} keyFor={(a) => a.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

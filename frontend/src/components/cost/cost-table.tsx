"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_CATEGORY_CONFIG } from "@/components/contracts/contract-category-config";
import { getVariance, getVarianceStatus } from "@/components/cost/cost-math";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { CostEntry } from "@/types/domain/cost-entry";

const VARIANCE_BADGE: Record<ReturnType<typeof getVarianceStatus>, { label: string; variant: "success" | "error" | "neutral" }> = {
  under: { label: "Under Budget", variant: "success" },
  over: { label: "Over Budget", variant: "error" },
  on_budget: { label: "On Budget", variant: "neutral" },
};

export function CostTable({
  entries,
  sortBy,
  sortDir,
  onSortChange,
  onView,
}: {
  entries: CostEntry[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (entry: CostEntry) => void;
}) {
  const { projects: allProjects } = useProjects();
  const columns: DataTableColumn<CostEntry>[] = [
    {
      key: "category",
      header: "Category",
      sortKey: "category",
      render: (e) => (
        <div>
          <p className="font-medium text-ink">{CONTRACT_CATEGORY_CONFIG[e.category].label}</p>
          {e.notes && <p className="text-xs text-ink-muted">{e.notes}</p>}
        </div>
      ),
    },
    {
      key: "project",
      header: "Project",
      render: (e) => allProjects.find((p) => p.id === e.projectId)?.name ?? "—",
    },
    {
      key: "budgetAmount",
      header: "Budget",
      sortKey: "budgetAmount",
      render: (e) => formatINR(e.budgetAmount),
    },
    {
      key: "actualAmount",
      header: "Actual",
      sortKey: "actualAmount",
      render: (e) => formatINR(e.actualAmount),
    },
    {
      key: "variance",
      header: "Variance",
      hideOnMobile: true,
      render: (e) => {
        const variance = getVariance(e.budgetAmount, e.actualAmount);
        return (
          <span className={variance < 0 ? "text-error" : variance > 0 ? "text-success" : "text-ink-muted"}>
            {variance >= 0 ? "+" : ""}
            {formatINR(variance)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (e) => {
        const status = getVarianceStatus(e.budgetAmount, e.actualAmount);
        const { label, variant } = VARIANCE_BADGE[status];
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
  ];

  return (
    <DataTable columns={columns} rows={entries} keyFor={(e) => e.id} sortBy={sortBy} sortDir={sortDir} onSortChange={onSortChange} onRowClick={onView} />
  );
}

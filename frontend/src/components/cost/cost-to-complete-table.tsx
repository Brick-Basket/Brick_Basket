"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_CATEGORY_CONFIG } from "@/components/contracts/contract-category-config";
import { getVarianceStatus } from "@/components/cost/cost-math";
import { formatINR } from "@/lib/utils/format";
import type { CostToCompleteRow } from "@/types/domain/cost-to-complete";

const VARIANCE_BADGE: Record<ReturnType<typeof getVarianceStatus>, { label: string; variant: "success" | "error" | "neutral" }> = {
  under: { label: "Under Estimate", variant: "success" },
  over: { label: "Over Estimate", variant: "error" },
  on_budget: { label: "On Estimate", variant: "neutral" },
};

/**
 * The owner's exact §8G table: Cost Category, Original Estimate (A),
 * Completed till date (B), Balance to complete (C), Total Estimated
 * Value (D=B+C), Variance. Clicking a row opens
 * `CostToCompleteBreakdownSheet` with that category's full calculation
 * lineage — the "show the calculation lineage/explanation where
 * practical" requirement, applied per row rather than only in the page's
 * static explainer.
 */
export function CostToCompleteTable({
  rows,
  onRowClick,
}: {
  rows: CostToCompleteRow[];
  onRowClick: (row: CostToCompleteRow) => void;
}) {
  const columns: DataTableColumn<CostToCompleteRow>[] = [
    {
      key: "category",
      header: "Cost Category",
      render: (r) => <p className="font-medium text-ink">{CONTRACT_CATEGORY_CONFIG[r.category].label}</p>,
    },
    {
      key: "originalEstimate",
      header: "Original Estimate (A)",
      render: (r) => formatINR(r.originalEstimate),
    },
    {
      key: "completedToDate",
      header: "Completed till date (B)",
      render: (r) => formatINR(r.completedToDate),
    },
    {
      key: "balanceToComplete",
      header: "Balance to complete (C)",
      render: (r) => formatINR(r.balanceToComplete),
    },
    {
      key: "totalEstimatedValue",
      header: "Total Estimated Value (D=B+C)",
      render: (r) => <span className="font-medium text-ink">{formatINR(r.totalEstimatedValue)}</span>,
    },
    {
      key: "variance",
      header: "Variance",
      render: (r) => {
        const status = getVarianceStatus(r.originalEstimate, r.totalEstimatedValue);
        const { label, variant } = VARIANCE_BADGE[status];
        return (
          <div className="flex flex-col gap-1">
            <span>
              {r.variance >= 0 ? "+" : ""}
              {formatINR(r.variance)}
            </span>
            <Badge variant={variant}>{label}</Badge>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      keyFor={(r) => r.category}
      onRowClick={onRowClick}
    />
  );
}

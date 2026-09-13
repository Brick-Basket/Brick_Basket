"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/format";
import { getVarianceStatus } from "@/components/cost/cost-math";
import type { CostToCompleteSummary as CostToCompleteSummaryData } from "@/types/domain/cost-to-complete";

const STATUS_STYLE = {
  under: { icon: TrendingDown, className: "text-success", label: "Under original estimate" },
  over: { icon: TrendingUp, className: "text-error", label: "Over original estimate" },
  on_budget: { icon: Minus, className: "text-ink-muted", label: "On original estimate" },
} as const;

/**
 * Restates the owner's own §8G headline formula — "Actual Cost +
 * Remaining Estimated Cost = Forecast Final Cost" — using this project's
 * totals, in the owner's own labels (Original budget / Actual cost to
 * date / Remaining estimated cost / Forecasted final cost) rather than
 * the table's A/B/C/D letters, plus the calculation-lineage explanation
 * the owner requirements explicitly ask for ("frontend must show the
 * calculation lineage/explanation where practical").
 *
 * `getVarianceStatus` is reused unchanged from `cost/cost-math.ts` (Part
 * 15) — it takes any (budget, actual)-shaped pair, and here that pair is
 * (Original Estimate, Forecast Final Cost), the same over/under/on-budget
 * framing `CostEntry`'s own summary card uses.
 */
export function CostToCompleteSummary({ summary }: { summary: CostToCompleteSummaryData }) {
  const status = getVarianceStatus(summary.totalOriginalEstimate, summary.totalEstimatedValue);
  const { icon: StatusIcon, className, label } = STATUS_STYLE[status];

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Original Budget</p>
          <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(summary.totalOriginalEstimate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Actual Cost to Date</p>
          <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(summary.totalCompletedToDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Remaining Estimated Cost</p>
          <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(summary.totalBalanceToComplete)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Forecasted Final Cost</p>
          <p className={`mt-1 flex items-center gap-1.5 font-heading text-xl font-semibold ${className}`}>
            <StatusIcon className="h-4 w-4" aria-hidden />
            {formatINR(summary.totalEstimatedValue)}
          </p>
        </div>
      </div>

      <p className="text-sm text-ink-muted">
        <span className="font-medium text-ink">Actual Cost to Date + Remaining Estimated Cost = Forecasted Final Cost</span> —
        {" "}{formatINR(summary.totalCompletedToDate)} + {formatINR(summary.totalBalanceToComplete)} = {formatINR(summary.totalEstimatedValue)}, per
        the owner&apos;s §8G formula. <span className={className}>{label}</span> by {formatINR(Math.abs(summary.totalVariance))} against the
        original budget above.
      </p>

      {summary.unallocatedOrderedTotal > 0 && (
        <p className="rounded-card border border-border bg-surface-muted p-3 text-xs text-ink-muted">
          {formatINR(summary.unallocatedOrderedTotal)} of ordered value on this project&apos;s Purchase Orders traces back to a
          requisition line entered as free-text (&ldquo;additional item,&rdquo; Part 8) with no linked Accepted Cost Estimate item — it
          cannot be attributed to a cost category below, so it is shown here rather than folded into any row.
        </p>
      )}

      <details className="text-xs text-ink-muted">
        <summary className="cursor-pointer font-medium text-ink">How each column below is calculated</summary>
        <ul className="mt-2 flex flex-col gap-1.5 pl-4 [&>li]:list-disc">
          <li>
            <span className="font-medium text-ink">Original Estimate (A)</span> — this project&apos;s Project Cost Accounting
            budget for the category (Part 15), itself set from Accepted Cost Estimate rates.
          </li>
          <li>
            <span className="font-medium text-ink">Completed till date (B)</span> — this project&apos;s Project Cost Accounting
            actual spend for the category (Part 15).
          </li>
          <li>
            <span className="font-medium text-ink">Balance to complete (C)</span> — ordered-but-not-yet-completed value
            (traced from this project&apos;s non-draft, non-rejected Purchase Orders back to an Accepted Cost Estimate category)
            plus balance-still-to-be-ordered value (the part of the original estimate not yet covered by spend or an order).
          </li>
          <li>
            <span className="font-medium text-ink">Total Estimated Value (D)</span> — B + C, exactly the owner&apos;s formula.
          </li>
          <li>
            <span className="font-medium text-ink">Variance</span> — A − D; positive is under the original estimate,
            negative is a projected overrun.
          </li>
        </ul>
      </details>
    </Card>
  );
}

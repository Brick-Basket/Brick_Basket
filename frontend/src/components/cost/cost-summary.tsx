"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useCostEntries } from "@/hooks/use-cost";
import { useContracts } from "@/hooks/use-contracts";
import { getTotalActual, getTotalBudget, getTotalVariance, getVarianceStatus } from "@/components/cost/cost-math";
import { formatINR } from "@/lib/utils/format";

const STATUS_STYLE = {
  under: { icon: TrendingDown, className: "text-success" },
  over: { icon: TrendingUp, className: "text-error" },
  on_budget: { icon: Minus, className: "text-ink-muted" },
} as const;

/**
 * Per-project Budget/Actual/Variance summary, with an over/under
 * indicator, per the owner's "budget/actual/variance view with
 * over/under indicators" requirement (§8A). Loads its own full,
 * unfiltered (by category/search) set of that project's `CostEntry`
 * rows — the list below may be narrowed by a category filter, but the
 * totals here always reflect the whole project.
 *
 * Also cross-links the project's accepted `Contract` value (Part 5) —
 * **FRONTEND IMPLEMENTATION DECISION**: composed directly via
 * `useContracts()` rather than an adapter-level cross-adapter call,
 * since this is a pure render-time display aggregate, not a write-side
 * side effect (contrast DPR's push into the Schedule adapter, Part 14).
 * "Expected Profit" (Contract Value − Total Actual) has no owner-
 * confirmed formula — flagged illustrative, see docs/OPEN_QUESTIONS.md
 * #36. `ContractListParams` has no `projectId` filter, so accepted
 * contracts are fetched and matched to this project client-side.
 */
export function CostSummary({ projectId }: { projectId: string }) {
  const { status, result } = useCostEntries({ projectId, page: 1, pageSize: 50 });
  const { status: contractStatus, result: contractResult } = useContracts({
    status: "accepted",
    page: 1,
    pageSize: 50,
  });

  if (status === "loading" || contractStatus === "loading") {
    return <LoadingSkeleton className="h-28 w-full" />;
  }

  const entries = result?.items ?? [];
  const totalBudget = getTotalBudget(entries);
  const totalActual = getTotalActual(entries);
  const totalVariance = getTotalVariance(entries);
  const varianceStatus = getVarianceStatus(totalBudget, totalActual);
  const { icon: StatusIcon, className } = STATUS_STYLE[varianceStatus];

  const projectContracts = (contractResult?.items ?? []).filter((c) => c.projectId === projectId);
  const contractValue = projectContracts.reduce(
    (sum, c) => sum + c.lineItems.reduce((lineSum, li) => lineSum + li.quantity * li.rate, 0),
    0,
  );
  const expectedProfit = contractValue - totalActual;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Budget</p>
          <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(totalBudget)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Actual</p>
          <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(totalActual)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Variance</p>
          <p className={`mt-1 flex items-center gap-1.5 font-heading text-xl font-semibold ${className}`}>
            <StatusIcon className="h-4 w-4" aria-hidden />
            {totalVariance >= 0 ? "+" : ""}
            {formatINR(totalVariance)}
          </p>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-sm text-ink-muted">No cost entries yet for this project — add one below to start tracking budget vs. actual.</p>
      )}

      {projectContracts.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Accepted Contract Value vs. Actual Spend
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="font-medium text-ink">{formatINR(contractValue)}</span> contract value across{" "}
            {projectContracts.length} accepted contract{projectContracts.length === 1 ? "" : "s"} —{" "}
            illustrative &ldquo;Expected Profit&rdquo; of{" "}
            <span className={expectedProfit >= 0 ? "font-medium text-success" : "font-medium text-error"}>
              {formatINR(expectedProfit)}
            </span>{" "}
            (contract value minus total actual spend; not an owner-confirmed formula).
          </p>
        </div>
      )}
    </Card>
  );
}

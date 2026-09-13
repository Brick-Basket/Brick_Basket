"use client";

import { Sheet } from "@/components/ui/sheet";
import { CONTRACT_CATEGORY_CONFIG } from "@/components/contracts/contract-category-config";
import { formatINR } from "@/lib/utils/format";
import type { CostToCompleteRow } from "@/types/domain/cost-to-complete";

/**
 * Per-category calculation lineage, opened from a `CostToCompleteTable`
 * row click — the same "click a row to see the full detail in a Sheet"
 * interaction `ScheduleProgressSheet` established (Part 13), applied here
 * to a computed report row instead of a mutable record.
 */
export function CostToCompleteBreakdownSheet({ row, onClose }: { row: CostToCompleteRow | null; onClose: () => void }) {
  return (
    <Sheet
      open={row !== null}
      onClose={onClose}
      title={row ? `${CONTRACT_CATEGORY_CONFIG[row.category].label} — calculation` : "Calculation"}
      description="How this row's Balance to complete (C) and Total Estimated Value (D) were derived."
    >
      {row && (
        <div className="flex flex-col gap-5 text-sm">
          <div className="flex flex-col gap-1 rounded-card border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Original Estimate (A)</p>
            <p className="font-heading text-lg font-semibold text-ink">{formatINR(row.originalEstimate)}</p>
            <p className="text-xs text-ink-muted">This project&apos;s Project Cost Accounting budget for this category (Part 15).</p>
          </div>

          <div className="flex flex-col gap-1 rounded-card border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Completed till date (B)</p>
            <p className="font-heading text-lg font-semibold text-ink">{formatINR(row.completedToDate)}</p>
            <p className="text-xs text-ink-muted">This project&apos;s Project Cost Accounting actual spend for this category (Part 15).</p>
          </div>

          <div className="flex flex-col gap-2 rounded-card border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Balance to complete (C)</p>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Ordered, not yet completed</span>
              <span className="font-medium text-ink">{formatINR(row.orderedNotCompleted)}</span>
            </div>
            <p className="text-xs text-ink-muted">
              max(0, Ordered total {formatINR(row.orderedTotal)} − Completed {formatINR(row.completedToDate)}) — traced from
              this project&apos;s Purchase Orders (past draft, not rejected) back to this category via the RFQ line&apos;s Accepted
              Cost Estimate reference.
            </p>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-ink-muted">Balance still to be ordered</span>
              <span className="font-medium text-ink">{formatINR(row.balanceToBeOrdered)}</span>
            </div>
            <p className="text-xs text-ink-muted">
              max(0, Original Estimate {formatINR(row.originalEstimate)} − max(Completed {formatINR(row.completedToDate)},
              Ordered {formatINR(row.orderedTotal)})) — the part of the estimate not yet covered by either spend or an order.
            </p>
            <div className="flex items-center justify-between border-t border-border pt-2 font-medium text-ink">
              <span>Total (C)</span>
              <span>{formatINR(row.balanceToComplete)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-card border border-border bg-surface-muted p-3">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Total Estimated Value (D = B + C)</span>
              <span className="font-heading text-lg font-semibold text-ink">{formatINR(row.totalEstimatedValue)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-ink-muted">Variance (A − D)</span>
              <span className={row.variance >= 0 ? "font-medium text-success" : "font-medium text-error"}>
                {row.variance >= 0 ? "+" : ""}
                {formatINR(row.variance)}
              </span>
            </div>
          </div>

          <p className="text-xs text-ink-muted">
            This lineage is a frontend implementation decision, not an owner-confirmed formula — see{" "}
            <code className="rounded bg-surface-muted px-1 py-0.5">docs/OPEN_QUESTIONS.md</code> #39, particularly the gap
            left by <code className="rounded bg-surface-muted px-1 py-0.5">ACEItem</code> carrying no quantity and the
            un-implemented &ldquo;supply vs. service &amp; composite works&rdquo; split for ordered-not-completed.
          </p>
        </div>
      )}
    </Sheet>
  );
}

import { Link2 } from "lucide-react";
import { getDPRWorkItem } from "@/lib/constants/dpr-work-items";
import { getCumulativeQty, getLineUom, getPercentComplete, getPreviousQty } from "@/components/dpr/dpr-work-item-math";
import type { DPRWorkItemHistoryEntry } from "@/lib/api/adapters/dpr-adapter";
import type { DPR, DPRWorkItemEntry } from "@/types/domain/dpr";

/**
 * Read-only work-item table for `DPRDetail` — the owner-required Sl. No. /
 * Work Item / Location / Unit / Planned / Previous / Today's / Cumulative /
 * % Complete / Remarks columns, plus a "Linked to Schedule" indicator.
 * Previous/Cumulative/% Complete are computed the same way the editor
 * previews them (`dpr-work-item-math.ts`) from `history` — never stored.
 */
export function DPRWorkItemsTable({
  dpr,
  lines,
  history,
}: {
  dpr: DPR;
  lines: DPRWorkItemEntry[];
  history: DPRWorkItemHistoryEntry[];
}) {
  if (lines.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border p-4 text-sm text-ink-muted">
        No work items were logged on this report.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">Sl. No.</th>
            <th className="px-4 py-3 font-medium text-ink-muted">Work Item</th>
            <th className="px-4 py-3 font-medium text-ink-muted">Location</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">Unit</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Planned</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Previous</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Today&apos;s</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">Cumulative</th>
            <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">% Complete</th>
            <th className="px-4 py-3 font-medium text-ink-muted">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const master = getDPRWorkItem(line.workItemMasterId);
            const previousQty = getPreviousQty(history, line.workItemMasterId, dpr.id, dpr.reportDate);
            const cumulativeQty = getCumulativeQty(previousQty, line.todayQty);
            const percentComplete = getPercentComplete(cumulativeQty, line.plannedQty);
            const description = master?.isOtherCatchAll ? line.otherDescription || master.description : master?.description ?? "—";

            return (
              <tr key={line.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{master?.slNo ?? "—"}</td>
                <td className="px-4 py-3 text-ink">
                  {description}
                  {line.scheduleActivityId && (
                    <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      <Link2 className="h-3 w-3" aria-hidden />
                      Linked to Schedule
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{line.location || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-muted">{getLineUom(master, line.otherUom)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{line.plannedQty.toLocaleString("en-IN")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-ink-muted">{previousQty.toLocaleString("en-IN")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{line.todayQty.toLocaleString("en-IN")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{cumulativeQty.toLocaleString("en-IN")}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-ink">{percentComplete.toFixed(0)}%</td>
                <td className="px-4 py-3 text-ink-muted">{line.remarks || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

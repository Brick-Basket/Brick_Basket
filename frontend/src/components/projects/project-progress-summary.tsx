"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useProjectProgressLog } from "@/hooks/use-projects";
import { useScheduleBasedProgress } from "@/hooks/use-project-progress";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { Project } from "@/types/domain/project";

/**
 * Read-only progress display for the customer-facing `/dashboard/projects`
 * page (Customer Module notifications/visibility follow-up, docs/
 * OPEN_QUESTIONS.md #81). This closes a gap found while explaining the
 * Customer Module to the owner: `Project.progressPercentage` and the
 * Schedule-derived breakdown it can show (see `src/lib/utils/
 * project-progress.ts`) existed on the staff/admin side
 * (`CustomerProjectProgress` on the Customer Detail screen) but had never
 * been added to the customer's own portal — a customer could not see their
 * own project's progress percentage anywhere until this component.
 *
 * Deliberately **read-only** — no edit control, no "Use this value"
 * action, no reason field. Only staff can change `progressPercentage`
 * (`customers:write`, enforced on `CustomerProjectProgress`), matching
 * every other customer-portal list's read-only framing (Documents, Site
 * Updates, Payments). This component only ever reads via
 * `useProjectProgressLog`/`useScheduleBasedProgress` — it never calls
 * `useUpdateProjectProgress`.
 *
 * One component instance per project (same reasoning `CustomerProjectProgress`
 * already documents): its two hooks must be called a fixed number of times
 * per render regardless of how many projects a customer has, so this is
 * only ever used inside a `.map()` over projects, never looped internally.
 */
export function ProjectProgressSummary({ project }: { project: Project }) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const pct = project.progressPercentage;
  const { result: computed, status: computedStatus } = useScheduleBasedProgress(project.id);
  const { entries: history, status: historyStatus } = useProjectProgressLog(project.id);
  const lastEntry = history[0];

  if (pct === undefined) {
    return (
      <div className="rounded-md bg-surface-muted/60 p-3 text-xs text-ink-muted">
        Progress tracking hasn&apos;t started for this project yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Progress</p>
        {historyStatus === "success" && lastEntry && (
          <p className="text-xs text-ink-muted">Updated {formatDate(lastEntry.changedAt)}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-brand-red" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
        <span className="w-12 text-right text-sm font-medium text-ink">{pct}%</span>
      </div>

      {computedStatus === "success" && computed && (
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setBreakdownOpen((o) => !o)}
            className="inline-flex items-center gap-1 self-start text-xs text-brand-red hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {breakdownOpen ? "Hide how this is tracked" : "See how this is tracked"}
            {breakdownOpen ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
          </button>
          {breakdownOpen && (
            <div className="overflow-hidden rounded-md border border-border">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-surface-muted text-ink-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">Work item</th>
                      <th className="px-2 py-1.5 text-right font-medium">Completed</th>
                      <th className="px-2 py-1.5 text-right font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {computed.breakdown.map((row) => (
                      <tr key={row.activityId} className="border-t border-border even:bg-surface-muted/40">
                        <td className="px-2 py-1.5 text-ink">{row.activity}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-ink-muted">
                          {row.executedQuantity}/{row.quantity} {row.uom}
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums text-ink">{row.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {computed.asOf && (
                <p className="border-t border-border bg-surface px-2 py-1.5 text-[11px] text-ink-muted">
                  Site data as of {formatDateTime(computed.asOf)}.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

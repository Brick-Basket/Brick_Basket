"use client";

import { useState } from "react";
import { Pencil, Loader2, Check, ChevronDown, ChevronUp, History, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useUpdateProjectProgress, useProjectProgressLog } from "@/hooks/use-projects";
import { useScheduleBasedProgress } from "@/hooks/use-project-progress";
import { manualProgressNeedsReason, PROGRESS_OVERRIDE_REASON_THRESHOLD } from "@/lib/utils/project-progress";
import { formatDateTime } from "@/lib/utils/format";
import type { Project } from "@/types/domain/project";

/**
 * Per-project progress editor for the Customer Module's "Projects &
 * Progress" card — extracted out of `customer-detail.tsx` and
 * substantially extended in the "robust progress mapping" follow-up pass
 * (see docs/OPEN_QUESTIONS.md and `src/lib/utils/project-progress.ts`'s
 * header comment for the full writeup of *why*).
 *
 * In one sentence: `Project.progressPercentage` is still the one field
 * that actually renders, but it's no longer just a number someone typed in
 * a box with no basis and no record of changing. Where the project has
 * Schedule activities (Part 13), this component also computes a
 * duration-weighted suggestion from that module's own real quantity/
 * progress data and surfaces it alongside the manual value, with a
 * one-click "Use this value" action; any manual edit that departs from
 * that suggestion by a lot, or moves the number backwards, asks for a
 * short reason; and every change — computed or manual — is kept in an
 * audit trail staff can expand right here.
 *
 * One component instance per project (same reasoning as before this pass):
 * `useUpdateProjectProgress`/`useProjectProgressLog`/`useScheduleBasedProgress`
 * must be called a fixed number of times per render regardless of how many
 * projects a customer has, never inside a variable-length loop in the
 * parent.
 */
export function CustomerProjectProgress({ project }: { project: Project }) {
  const { session } = useSession();
  const [editing, setEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [value, setValue] = useState(project.progressPercentage ?? 0);
  const [reason, setReason] = useState("");

  const { submit, status, error } = useUpdateProjectProgress();
  const { result: computed, status: computedStatus } = useScheduleBasedProgress(project.id);
  const { entries: history, status: historyStatus, refetch: refetchHistory } = useProjectProgressLog(
    historyOpen ? project.id : null,
  );

  const pct = project.progressPercentage ?? 0;
  const clampedValue = Math.min(100, Math.max(0, Math.round(value)));
  const needsReason = editing && manualProgressNeedsReason(clampedValue, pct, computed?.percentage ?? null);
  const canSave = !needsReason || reason.trim().length > 0;

  const handleStartEditing = () => {
    setValue(pct);
    setReason("");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!session || !canSave) return;
    const actor = { id: session.user.id, name: session.user.name };
    const result = await submit(
      project.id,
      { progressPercentage: clampedValue, source: "manual", reason: reason.trim() || undefined },
      actor,
    );
    if (result) {
      setEditing(false);
      setReason("");
      if (historyOpen) refetchHistory();
    }
  };

  const handleUseComputed = async () => {
    if (!session || !computed) return;
    const actor = { id: session.user.id, name: session.user.name };
    const result = await submit(project.id, { progressPercentage: computed.percentage, source: "schedule_computed" }, actor);
    if (result && historyOpen) refetchHistory();
  };

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-ink">{project.name}</p>
          <p className="text-xs text-ink-muted">{project.location}</p>
        </div>
        <PermissionGuard permission="customers:write">
          {editing ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                  className="h-9 w-20"
                  aria-label={`Progress percentage for ${project.name}`}
                />
                <Button size="sm" onClick={handleSave} disabled={status === "loading" || !canSave}>
                  {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={status === "loading"}>
                  Cancel
                </Button>
              </div>
              {needsReason && (
                <div className="flex w-full flex-col gap-1">
                  <p className="flex items-center gap-1 text-right text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    {clampedValue < pct
                      ? "Progress is moving backwards — add a short reason."
                      : `This is more than ${PROGRESS_OVERRIDE_REASON_THRESHOLD} points from the Schedule-computed suggestion — add a short reason.`}
                  </p>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why is this changing? (e.g. rework, corrected an earlier over-count, site visit confirmed otherwise)"
                    className="min-h-[60px] text-sm"
                    invalid={needsReason && reason.trim().length === 0}
                  />
                </div>
              )}
              {error && <p className="text-xs text-error">{error}</p>}
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={handleStartEditing}>
              <Pencil className="h-4 w-4" aria-hidden />
              Update Progress
            </Button>
          )}
        </PermissionGuard>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-brand-red" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
        </div>
        <span className="w-12 text-right text-sm font-medium text-ink">{pct}%</span>
      </div>

      {computedStatus === "success" && computed && (
        <div className="flex flex-col gap-2 rounded-md bg-surface-muted/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Sparkles className="h-3.5 w-3.5 text-brand-red" aria-hidden />
              <span>
                Computed from Schedule: <span className="font-semibold text-ink">{computed.percentage}%</span>
                {computed.asOf && <> · as of {formatDateTime(computed.asOf)}</>}
              </span>
              <button
                type="button"
                onClick={() => setBreakdownOpen((o) => !o)}
                className="inline-flex items-center gap-0.5 text-brand-red hover:underline"
              >
                {breakdownOpen ? "Hide breakdown" : "View breakdown"}
                {breakdownOpen ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
              </button>
            </div>
            {computed.percentage !== pct && (
              <PermissionGuard permission="customers:write">
                <Button size="sm" variant="outline" onClick={handleUseComputed} disabled={status === "loading"}>
                  Use this value
                </Button>
              </PermissionGuard>
            )}
          </div>
          {breakdownOpen && (
            <div className="overflow-hidden rounded-md border border-border">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10 bg-surface text-ink-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">Activity</th>
                      <th className="px-2 py-1.5 text-right font-medium">Executed</th>
                      <th className="px-2 py-1.5 text-right font-medium">%</th>
                      <th className="px-2 py-1.5 text-right font-medium">Weight (days)</th>
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
                        <td className="px-2 py-1.5 text-right tabular-nums text-ink-muted">{row.weightDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-border bg-surface px-2 py-1.5 text-[11px] text-ink-muted">
                Overall % is each activity&apos;s completion weighted by its planned duration — a longer activity moves the total more.
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <button
          type="button"
          onClick={() => setHistoryOpen((o) => !o)}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <History className="h-3.5 w-3.5" aria-hidden />
          {historyOpen ? "Hide history" : "History"}
          {historyOpen ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />}
        </button>
        {historyOpen && (
          <div className="mt-2 flex flex-col gap-2">
            {historyStatus === "loading" && <p className="text-xs text-ink-muted">Loading history…</p>}
            {historyStatus === "success" && history.length === 0 && (
              <p className="text-xs text-ink-muted">No changes recorded yet — this project&apos;s initial value was seeded, not logged.</p>
            )}
            {history.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-0.5 border-l-2 border-border pl-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-ink">
                    {entry.previousPercentage ?? "—"}% → {entry.newPercentage}%
                  </span>
                  <Badge variant={entry.source === "schedule_computed" ? "brand" : "neutral"} className="text-[10px]">
                    {entry.source === "schedule_computed" ? "From Schedule" : "Manual"}
                  </Badge>
                </div>
                <p className="text-ink-muted">
                  {formatDateTime(entry.changedAt)} · {entry.changedByName}
                </p>
                {entry.reason && <p className="italic text-ink-muted">&ldquo;{entry.reason}&rdquo;</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

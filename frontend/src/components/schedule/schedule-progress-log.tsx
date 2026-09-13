"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/domain/empty-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useAddScheduleProgress } from "@/hooks/use-schedule";
import { formatDate } from "@/lib/utils/format";
import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

/**
 * Progress tracking log for the "Update Progress" sheet — the owner-
 * required "Project Manager updates executed quantities" action. Adds a
 * new, dated, cumulative reading (`schedule:write`) and renders the full
 * history newest first, the same append-only-log presentation as
 * `LeadActivityLog`/`VendorAssessmentHistory`.
 */
export function ScheduleProgressLog({
  activity,
  entries,
  onEntryAdded,
}: {
  activity: ScheduleActivity;
  entries: ScheduleProgressEntry[];
  onEntryAdded: () => void;
}) {
  const { session } = useSession();
  const { submit, status, error } = useAddScheduleProgress();
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().slice(0, 10));
  const [executedQuantity, setExecutedQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleAdd = async () => {
    if (!session) return;
    const parsed = Number(executedQuantity);
    if (executedQuantity === "" || Number.isNaN(parsed) || parsed < 0) return;
    const entry = await submit(
      activity.id,
      { recordedAt, executedQuantity: parsed, remarks: remarks.trim() || undefined },
      { id: session.user.id, name: session.user.name },
    );
    if (entry) {
      setExecutedQuantity("");
      setRemarks("");
      onEntryAdded();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PermissionGuard permission="schedule:write">
        <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-muted p-4">
          <p className="text-sm font-medium text-ink">Record Progress</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="progress-date">As Of Date</Label>
              <Input id="progress-date" type="date" className="mt-1.5" value={recordedAt} onChange={(e) => setRecordedAt(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="progress-quantity">Executed Quantity (cumulative, {activity.uom})</Label>
              <Input
                id="progress-quantity"
                type="number"
                step="any"
                min={0}
                className="mt-1.5"
                value={executedQuantity}
                onChange={(e) => setExecutedQuantity(e.target.value)}
                placeholder={`out of ${activity.quantity.toLocaleString("en-IN")}`}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="progress-remarks">Remarks (optional)</Label>
            <Textarea id="progress-remarks" className="mt-1.5" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="What's driving the pace, any blockers…" />
          </div>
          {status === "error" && (
            <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={executedQuantity === "" || status === "loading"}>
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Record
            </Button>
          </div>
        </div>
      </PermissionGuard>

      {entries.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No progress recorded yet" description="Executed-quantity readings will appear here, newest first." />
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-card border border-border bg-surface p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-medium text-ink">
                  {entry.executedQuantity.toLocaleString("en-IN")} {activity.uom}
                  <span className="ml-1 text-xs font-normal text-ink-muted">
                    ({((entry.executedQuantity / activity.quantity) * 100).toFixed(0)}%)
                  </span>
                </p>
                <p className="text-xs text-ink-muted">as of {formatDate(entry.recordedAt)}</p>
              </div>
              <p className="mt-1 text-xs text-ink-muted">{entry.recordedByName}</p>
              {entry.remarks && <p className="mt-1.5 text-sm text-ink">{entry.remarks}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, MessageSquare, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AuditTimeline } from "@/components/domain/audit-timeline";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useAddLeadActivity } from "@/hooks/use-leads";
import type { LeadActivity } from "@/types/domain/lead-activity";

const ACTIVITY_ICON: Record<LeadActivity["type"], typeof MessageSquare> = {
  note: MessageSquare,
  status_change: RefreshCcw,
};

/**
 * Follow-up activity log for the lead detail drawer — required by the Lead
 * Management module ("follow-up activity log"). Status-change entries are
 * appended automatically by `LeadsAdapter.transition`; this component adds
 * free-text notes and renders the full timeline, newest first.
 */
export function LeadActivityLog({
  leadId,
  activities,
  onActivityAdded,
}: {
  leadId: string;
  activities: LeadActivity[];
  onActivityAdded: (activity: LeadActivity) => void;
}) {
  const { session } = useSession();
  const { submit, status, error } = useAddLeadActivity();
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    if (!note.trim() || !session) return;
    const activity = await submit(leadId, note.trim(), { id: session.user.id, name: session.user.name });
    if (activity) {
      onActivityAdded(activity);
      setNote("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PermissionGuard permission="leads:write">
        <div className="flex flex-col gap-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Log a call, email, or note about this lead…"
            className="min-h-[80px]"
            aria-label="Add a follow-up note"
          />
          {status === "error" && (
            <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd} disabled={!note.trim() || status === "loading"}>
              {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Add Note
            </Button>
          </div>
        </div>
      </PermissionGuard>

      <AuditTimeline
        entries={activities.map((activity) => ({ ...activity, actorName: activity.authorName }))}
        getIcon={(entry) => ACTIVITY_ICON[entry.type] ?? MessageSquare}
        emptyTitle="No follow-up activity yet"
        emptyDescription="Calls, emails, and status changes will appear here."
      />
    </div>
  );
}

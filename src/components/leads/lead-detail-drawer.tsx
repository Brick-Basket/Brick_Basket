"use client";

import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/domain/status-badge";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ErrorState } from "@/components/domain/error-state";
import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { findDemoUserById } from "@/lib/auth/mock-users";
import { useLead, useTransitionLead } from "@/hooks/use-leads";
import { LEAD_SOURCE_CONFIG } from "@/components/leads/lead-source-config";
import { LEAD_STATUS_CONFIG, LEAD_STATUS_ORDER } from "@/components/leads/lead-status-config";
import { LeadActivityLog } from "@/components/leads/lead-activity-log";
import type { LeadStatus } from "@/types/domain/lead";

/**
 * Read-focused detail view for a single lead — status transitions and the
 * follow-up log happen here; editing name/contact/assignment routes to
 * `LeadForm` (see the parent page's "Edit" action) to keep this drawer from
 * becoming a second copy of the form.
 */
export function LeadDetailDrawer({
  leadId,
  onClose,
  onEdit,
}: {
  leadId: string | null;
  onClose: () => void;
  onEdit: (leadId: string) => void;
}) {
  const { status, error, lead, activities, refetch } = useLead(leadId);
  const { submit: transition, status: transitionStatus } = useTransitionLead();
  const [pendingStatus, setPendingStatus] = useState<LeadStatus | null>(null);

  const handleConfirmTransition = async () => {
    if (!lead || !pendingStatus) return;
    const updated = await transition(lead.id, pendingStatus);
    setPendingStatus(null);
    if (updated) refetch();
  };

  return (
    <>
      <Sheet
        open={!!leadId}
        onClose={onClose}
        title={lead ? lead.name : "Lead"}
        description={lead ? LEAD_SOURCE_CONFIG[lead.source].label : undefined}
        footer={
          lead && (
            <PermissionGuard permission="leads:write">
              <Button className="w-full" variant="outline" onClick={() => onEdit(lead.id)}>
                Edit Lead
              </Button>
            </PermissionGuard>
          )
        }
      >
        {status === "loading" && (
          <div className="flex flex-col gap-3">
            <LoadingSkeleton className="h-4 w-2/3" />
            <LoadingSkeleton className="h-4 w-1/2" />
            <LoadingSkeleton className="h-24 w-full" />
          </div>
        )}

        {status === "error" && (
          <ErrorState title="Could not load this lead" description={error ?? undefined} onRetry={refetch} />
        )}

        {status === "success" && lead && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={lead.status} config={LEAD_STATUS_CONFIG} />
              <PermissionGuard permission="leads:write">
                <Select
                  className="h-8 w-auto text-xs"
                  value={lead.status}
                  disabled={transitionStatus === "loading"}
                  onChange={(e) => setPendingStatus(e.target.value as LeadStatus)}
                  aria-label="Change lead status"
                >
                  {LEAD_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </Select>
              </PermissionGuard>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2 text-ink">
                <Mail className="h-4 w-4 text-ink-muted" aria-hidden />
                <a href={`mailto:${lead.email}`} className="hover:underline">
                  {lead.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-ink">
                <Phone className="h-4 w-4 text-ink-muted" aria-hidden />
                <a href={`tel:${lead.phone}`} className="hover:underline">
                  {lead.phone}
                </a>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Subject</dt>
                <dd className="mt-0.5 text-ink">{lead.subject}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Message</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-ink">{lead.message}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Assigned To</dt>
                <dd className="mt-0.5 text-ink">
                  {lead.assignedTo ? findDemoUserById(lead.assignedTo)?.name ?? "—" : "Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Received</dt>
                <dd className="mt-0.5 text-ink">
                  {new Date(lead.createdAt).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>

            <div className="border-t border-border pt-4">
              <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Follow-up Activity</h3>
              <LeadActivityLog leadId={lead.id} activities={activities} onActivityAdded={refetch} />
            </div>
          </div>
        )}
      </Sheet>

      <ConfirmationDialog
        open={!!pendingStatus}
        onClose={() => setPendingStatus(null)}
        onConfirm={handleConfirmTransition}
        title="Change lead status?"
        description={
          pendingStatus
            ? `This moves the lead to "${LEAD_STATUS_CONFIG[pendingStatus].label}" and logs it in the follow-up activity.`
            : undefined
        }
        confirmLabel="Change Status"
        loading={transitionStatus === "loading"}
      />
    </>
  );
}

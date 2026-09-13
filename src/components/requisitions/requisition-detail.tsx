"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useRequisition, useDecideRequisition, useSubmitRequisition } from "@/hooks/use-requisitions";
import { useRFQs } from "@/hooks/use-rfq";
import { RequisitionStatusTimeline } from "@/components/requisitions/requisition-status-timeline";
import { MaterialRequirementTable } from "@/components/requisitions/material-requirement-table";
import { RequisitionAuditHistory } from "@/components/requisitions/requisition-audit-history";
import { REQUISITION_STATUS_CONFIG } from "@/components/requisitions/requisition-status-config";
import { formatDateTime } from "@/lib/utils/format";
import { useProject } from "@/hooks/use-projects";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

/**
 * Read + action surface for a single requisition, used by
 * `/admin/supply-chain/requisitions/[id]`. No customer-facing
 * counterpart — the owner requirements don't call for one (unlike
 * Contracts, which are explicitly admin + customer).
 */
export function RequisitionDetail({ requisitionId, onEdit }: { requisitionId: string; onEdit?: () => void }) {
  const router = useRouter();
  const { session } = useSession();
  const { status, error, requisition, lines, audit, refetch } = useRequisition(requisitionId);
  const { submit: submitRequisition, status: submitStatus, error: submitError } = useSubmitRequisition();
  const { submit: decide, status: decideStatus, error: decideError } = useDecideRequisition();
  // Backs the "Create RFQ" / "View RFQ" link below — wires the explicit
  // Requisition → RFQ hand-off (RFQ Management, Part 9) the same way
  // Part 8 wired ACE → Requisition.
  const { result: rfqLookup } = useRFQs({ requisitionId, pageSize: 1 });
  // Called unconditionally, before the loading/error early returns below —
  // `requisition` may still be undefined on the first render, which is
  // exactly what `useProject`'s own `id: string | null` guard is for
  // (Rules of Hooks: this can't be called after an early `return`).
  const { project } = useProject(requisition?.projectId ?? null);

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-1/2" />
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-48 w-full" />
      </div>
    );
  }

  if (status === "error" || !requisition) {
    return <ErrorState title="Could not load this requisition" description={error ?? undefined} onRetry={refetch} />;
  }

  const actor = session ? { id: session.user.id, name: session.user.name } : null;

  // FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
  // 13): guarded on the mutation's return value — same fix as
  // `ContractDetail`/`MRCDetail`, see docs/OPEN_QUESTIONS.md #45.
  const handleSubmit = async () => {
    if (!actor) return;
    const updated = await submitRequisition(requisition.id, actor);
    if (!updated) return;
    setConfirmSubmit(false);
    refetch();
  };

  const handleApprove = async () => {
    if (!actor) return;
    const updated = await decide(requisition.id, "approved", actor);
    if (!updated) return;
    setConfirmApprove(false);
    refetch();
  };

  const handleReject = async () => {
    if (!actor) return;
    const updated = await decide(requisition.id, "rejected", actor, rejectReason.trim() || undefined);
    if (!updated) return;
    setRejecting(false);
    setRejectReason("");
    refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{requisition.requisitionNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">{project?.name ?? "Requisition"}</h2>
          <p className="text-sm text-ink-muted">Requested by {requisition.requestedByName}</p>
        </div>
        <StatusBadge status={requisition.status} config={REQUISITION_STATUS_CONFIG} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <RequisitionStatusTimeline status={requisition.status} />
        </CardContent>
      </Card>

      <PermissionGuard permission="requisitions:create">
        <div className="flex flex-wrap gap-2">
          {(requisition.status === "draft" || requisition.status === "rejected") && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              {requisition.status === "rejected" ? "Revise Requisition" : "Edit Requisition"}
            </Button>
          )}
          {requisition.status === "draft" && (
            <Button onClick={() => setConfirmSubmit(true)} disabled={submitStatus === "loading"}>
              Submit for Review
            </Button>
          )}
        </div>
      </PermissionGuard>

      {requisition.status === "approved" && (
        <PermissionGuard permission="rfq:read">
          <div className="flex flex-wrap gap-2">
            {rfqLookup && rfqLookup.items.length > 0 ? (
              <Button variant="outline" onClick={() => router.push(`${ADMIN_ROUTES.rfqs}/${rfqLookup.items[0]!.id}`)}>
                View RFQ
              </Button>
            ) : (
              <PermissionGuard permission="rfq:compare">
                <Button variant="outline" onClick={() => router.push(`${ADMIN_ROUTES.rfqs}/new?requisitionId=${requisitionId}`)}>
                  Create RFQ
                </Button>
              </PermissionGuard>
            )}
          </div>
        </PermissionGuard>
      )}

      {requisition.status === "submitted" && (
        <PermissionGuard permission="requisitions:approve">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm text-ink-muted">Review the requirement items below, then approve or reject.</p>
              {decideError && <p className="text-sm text-error">{decideError}</p>}
              {!rejecting ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setConfirmApprove(true)} disabled={decideStatus === "loading"}>
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => setRejecting(true)} disabled={decideStatus === "loading"}>
                    Reject
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="reject-reason">Reason (optional)</Label>
                    <Textarea
                      id="reject-reason"
                      className="mt-1.5"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Let the requester know what needs to change…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setRejecting(false)} disabled={decideStatus === "loading"}>
                      Cancel
                    </Button>
                    <Button variant="secondary" onClick={handleReject} disabled={decideStatus === "loading"}>
                      Confirm Reject
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {requisition.status === "rejected" && requisition.rejectReason && (
        <div className="rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <span className="font-medium">Reject reason: </span>
          {requisition.rejectReason}
        </div>
      )}

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Requirement Items</h3>
        <MaterialRequirementTable lines={lines} />
      </div>

      {requisition.notes && (
        <div>
          <h3 className="mb-2 font-heading text-sm font-semibold text-ink">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{requisition.notes}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(requisition.createdAt)}</dd>
        </div>
        {requisition.submittedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Submitted</dt>
            <dd className="text-ink">{formatDateTime(requisition.submittedAt)}</dd>
          </div>
        )}
        {requisition.decidedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Decided</dt>
            <dd className="text-ink">{formatDateTime(requisition.decidedAt)}</dd>
          </div>
        )}
      </dl>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">History</h3>
        <RequisitionAuditHistory entries={audit} />
      </div>

      <ConfirmationDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit for review?"
        description="Once submitted, you won't be able to edit this requisition until it's decided — or reset to draft if it's rejected."
        confirmLabel="Submit"
        loading={submitStatus === "loading"}
        error={submitError}
      />
      <ConfirmationDialog
        open={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={handleApprove}
        title="Approve this requisition?"
        description="This marks the requisition ready to move forward (RFQ Management, Part 9, picks up from here)."
        confirmLabel="Approve"
        loading={decideStatus === "loading"}
        error={decideError}
      />
    </div>
  );
}

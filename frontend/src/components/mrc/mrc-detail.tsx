"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useMRC, useIssueMRC, useRespondToMRC, useWithdrawMRC } from "@/hooks/use-mrc";
import { MRCStatusTimeline } from "@/components/mrc/mrc-status-timeline";
import { MRCLineItemsTable } from "@/components/mrc/mrc-line-items-table";
import { MRC_STATUS_CONFIG } from "@/components/mrc/mrc-status-config";
import { useProjects } from "@/hooks/use-projects";
import { formatDateTime } from "@/lib/utils/format";
import type { Customer } from "@/types/domain/customer";

/**
 * Shared read + action surface for a single MRC, used by both
 * `/admin/stores/mrc/[id]` and `/dashboard/mrc/[id]`, modeled closely on
 * `ContractDetail` (Part 5). `perspective` controls which actions render —
 * "admin" gets edit/issue/withdraw, "customer" gets accept/decline — but
 * the read layout (timeline, line items) is identical on both sides.
 * Unlike `ContractDetail`, there is no audit-history section — see
 * `mrc-adapter.ts`'s header comment and docs/OPEN_QUESTIONS.md #33.
 */
export function MRCDetail({
  mrcId,
  perspective,
  customer,
  onEdit,
}: {
  mrcId: string;
  perspective: "admin" | "customer";
  /** Resolved customer record, for display — the caller already has this from its list query. */
  customer?: Customer | null;
  onEdit?: () => void;
}) {
  const { session } = useSession();
  const { status, error, mrc, lineItems, refetch } = useMRC(mrcId);
  const { submit: issue, status: issueStatus, error: issueError } = useIssueMRC();
  const { submit: withdraw, status: withdrawStatus, error: withdrawError } = useWithdrawMRC();
  const { submit: respond, status: respondStatus, error: respondError } = useRespondToMRC();
  const { projects: allProjects } = useProjects();

  const [confirmIssue, setConfirmIssue] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-1/2" />
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-48 w-full" />
      </div>
    );
  }

  if (status === "error" || !mrc) {
    return <ErrorState title="Could not load this MRC" description={error ?? undefined} onRetry={refetch} />;
  }

  const actor = session ? { id: session.user.id, name: session.user.name } : null;
  const project = mrc.projectId ? allProjects.find((p) => p.id === mrc.projectId) : null;

  // FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
  // 13): same fix as `ContractDetail` — guard on the mutation's return
  // value so a failed action doesn't close its confirm dialog / refetch as
  // if it had succeeded. See docs/OPEN_QUESTIONS.md #45.
  const handleIssue = async () => {
    if (!actor) return;
    const updated = await issue(mrc.id, actor);
    if (!updated) return;
    setConfirmIssue(false);
    refetch();
  };

  const handleWithdraw = async () => {
    if (!actor) return;
    const updated = await withdraw(mrc.id, actor);
    if (!updated) return;
    setConfirmWithdraw(false);
    refetch();
  };

  const handleAccept = async () => {
    if (!actor) return;
    const updated = await respond(mrc.id, "accepted", actor);
    if (!updated) return;
    setConfirmAccept(false);
    refetch();
  };

  const handleDecline = async () => {
    if (!actor) return;
    const updated = await respond(mrc.id, "declined", actor, declineReason.trim() || undefined);
    if (!updated) return;
    setDeclining(false);
    setDeclineReason("");
    refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{mrc.mrcNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">Material Receipt Certificate</h2>
          {customer && <p className="text-sm text-ink-muted">{customer.name}</p>}
          {project && <p className="text-sm text-ink-muted">{project.name}</p>}
        </div>
        <StatusBadge status={mrc.status} config={MRC_STATUS_CONFIG} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <MRCStatusTimeline status={mrc.status} />
        </CardContent>
      </Card>

      {perspective === "admin" && (
        <PermissionGuard permission="mrc:issue">
          <div className="flex flex-wrap gap-2">
            {(mrc.status === "draft" || mrc.status === "declined") && onEdit && (
              <Button variant="outline" onClick={onEdit}>
                {mrc.status === "declined" ? "Revise MRC" : "Edit MRC"}
              </Button>
            )}
            {mrc.status === "draft" && (
              <Button onClick={() => setConfirmIssue(true)} disabled={issueStatus === "loading"}>
                Issue for Customer Acceptance
              </Button>
            )}
            {mrc.status === "issued" && (
              <Button variant="outline" onClick={() => setConfirmWithdraw(true)} disabled={withdrawStatus === "loading"}>
                Withdraw to Draft
              </Button>
            )}
          </div>
        </PermissionGuard>
      )}

      {perspective === "customer" && mrc.status === "issued" && (
        <PermissionGuard permission="mrc:accept">
          <Card>
            <CardHeader>
              <CardTitle>Review this certificate</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-ink-muted">
                Review the materials, make and warranty terms below, then accept or decline. Once accepted, this
                certificate becomes read-only.
              </p>
              {respondError && <p className="text-sm text-error">{respondError}</p>}
              {!declining ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setConfirmAccept(true)} disabled={respondStatus === "loading"}>
                    Accept Certificate
                  </Button>
                  <Button variant="outline" onClick={() => setDeclining(true)} disabled={respondStatus === "loading"}>
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="mrc-decline-reason">Reason (optional)</Label>
                    <Textarea
                      id="mrc-decline-reason"
                      className="mt-1.5"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Let us know what needs to change…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setDeclining(false)} disabled={respondStatus === "loading"}>
                      Cancel
                    </Button>
                    <Button variant="secondary" onClick={handleDecline} disabled={respondStatus === "loading"}>
                      Confirm Decline
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {mrc.status === "declined" && mrc.declineReason && (
        <div className="rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <span className="font-medium">Decline reason: </span>
          {mrc.declineReason}
        </div>
      )}

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Materials</h3>
        <MRCLineItemsTable lineItems={lineItems} />
      </div>

      {mrc.notes && (
        <div>
          <h3 className="mb-2 font-heading text-sm font-semibold text-ink">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{mrc.notes}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(mrc.createdAt)}</dd>
        </div>
        {mrc.issuedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Issued</dt>
            <dd className="text-ink">{formatDateTime(mrc.issuedAt)}</dd>
          </div>
        )}
        {mrc.respondedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Responded</dt>
            <dd className="text-ink">{formatDateTime(mrc.respondedAt)}</dd>
          </div>
        )}
      </dl>

      <ConfirmationDialog
        open={confirmIssue}
        onClose={() => setConfirmIssue(false)}
        onConfirm={handleIssue}
        title="Issue for customer acceptance?"
        description="The customer will be able to review and accept or decline this certificate. You won't be able to edit it while it's out for review — use Withdraw to Draft first if you need to."
        confirmLabel="Issue"
        loading={issueStatus === "loading"}
        error={issueError}
      />
      <ConfirmationDialog
        open={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
        onConfirm={handleWithdraw}
        title="Withdraw to draft?"
        description="This recalls the certificate from the customer's view so you can revise it. They'll no longer be able to respond until you issue it again."
        confirmLabel="Withdraw"
        loading={withdrawStatus === "loading"}
        error={withdrawError}
      />
      <ConfirmationDialog
        open={confirmAccept}
        onClose={() => setConfirmAccept(false)}
        onConfirm={handleAccept}
        title="Accept this certificate?"
        description="Once accepted, this MRC becomes read-only for both you and BrickBasket."
        confirmLabel="Accept"
        loading={respondStatus === "loading"}
        error={respondError}
      />
    </div>
  );
}

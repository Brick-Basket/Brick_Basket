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
import { useContract, useRespondToContract, useSendContractForAcceptance, useWithdrawContract } from "@/hooks/use-contracts";
import { ContractStatusTimeline } from "@/components/contracts/contract-status-timeline";
import { ContractLineItemsTable } from "@/components/contracts/contract-line-items-table";
import { ContractAuditHistory } from "@/components/contracts/contract-audit-history";
import { CONTRACT_STATUS_CONFIG } from "@/components/contracts/contract-status-config";
import { formatDateTime } from "@/lib/utils/format";
import type { Customer } from "@/types/domain/customer";

/**
 * Shared read + action surface for a single contract, used by both
 * `/admin/contracts/[id]` and `/dashboard/contracts/[id]`. `perspective`
 * controls which actions render — "admin" gets edit/send/withdraw,
 * "customer" gets accept/decline — but the read layout (timeline, line
 * items, audit history) is identical on both sides, matching the owner
 * requirement that an accepted contract is "stored in both modules".
 */
export function ContractDetail({
  contractId,
  perspective,
  customer,
  onEdit,
}: {
  contractId: string;
  perspective: "admin" | "customer";
  /** Resolved customer record, for display — the caller already has this from its list query. */
  customer?: Customer | null;
  onEdit?: () => void;
}) {
  const { session } = useSession();
  const { status, error, contract, audit, refetch } = useContract(contractId);
  const { submit: sendForAcceptance, status: sendStatus, error: sendError } = useSendContractForAcceptance();
  const { submit: withdraw, status: withdrawStatus, error: withdrawError } = useWithdrawContract();
  const { submit: respond, status: respondStatus, error: respondError } = useRespondToContract();

  const [confirmSend, setConfirmSend] = useState(false);
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

  if (status === "error" || !contract) {
    return <ErrorState title="Could not load this contract" description={error ?? undefined} onRetry={refetch} />;
  }

  const actor = session ? { id: session.user.id, name: session.user.name } : null;

  // FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
  // 13): these four handlers used to close their confirm dialog and
  // refetch unconditionally after `await`ing the mutation — since these
  // mutation hooks catch their own errors and resolve to `null` rather
  // than throwing, a rejected action (e.g. the backend refusing to send an
  // incomplete contract for acceptance) closed the dialog and looked
  // exactly like success. Now guarded on the mutation's return value: the
  // dialog only closes and the detail only refetches on a real success,
  // and the mutation's own `error` is passed to `ConfirmationDialog` so a
  // failure stays visible instead of vanishing with the dialog.
  const handleSend = async () => {
    if (!actor) return;
    const updated = await sendForAcceptance(contract.id, actor);
    if (!updated) return;
    setConfirmSend(false);
    refetch();
  };

  const handleWithdraw = async () => {
    if (!actor) return;
    const updated = await withdraw(contract.id, actor);
    if (!updated) return;
    setConfirmWithdraw(false);
    refetch();
  };

  const handleAccept = async () => {
    if (!actor) return;
    const updated = await respond(contract.id, "accepted", actor);
    if (!updated) return;
    setConfirmAccept(false);
    refetch();
  };

  const handleDecline = async () => {
    if (!actor) return;
    const updated = await respond(contract.id, "declined", actor, declineReason.trim() || undefined);
    if (!updated) return;
    setDeclining(false);
    setDeclineReason("");
    refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{contract.contractNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">{contract.title}</h2>
          {customer && <p className="text-sm text-ink-muted">{customer.name}</p>}
        </div>
        <StatusBadge status={contract.status} config={CONTRACT_STATUS_CONFIG} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <ContractStatusTimeline status={contract.status} />
        </CardContent>
      </Card>

      {perspective === "admin" && (
        <PermissionGuard permission="contracts:write">
          <div className="flex flex-wrap gap-2">
            {contract.status === "draft" && onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Edit Contract
              </Button>
            )}
            {contract.status === "declined" && onEdit && (
              <Button variant="outline" onClick={onEdit}>
                Revise Contract
              </Button>
            )}
            {contract.status === "draft" && (
              <PermissionGuard permission="contracts:send_for_acceptance">
                <Button onClick={() => setConfirmSend(true)} disabled={sendStatus === "loading"}>
                  Send for Acceptance
                </Button>
              </PermissionGuard>
            )}
            {contract.status === "sent_for_acceptance" && (
              <PermissionGuard permission="contracts:send_for_acceptance">
                <Button variant="outline" onClick={() => setConfirmWithdraw(true)} disabled={withdrawStatus === "loading"}>
                  Withdraw to Draft
                </Button>
              </PermissionGuard>
            )}
          </div>
        </PermissionGuard>
      )}

      {perspective === "customer" && contract.status === "sent_for_acceptance" && (
        <PermissionGuard permission="contracts:accept">
          <Card>
            <CardHeader>
              <CardTitle>Review this contract</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-ink-muted">
                Review the line items and terms below, then accept or decline. Once accepted, this contract becomes
                read-only.
              </p>
              {respondError && <p className="text-sm text-error">{respondError}</p>}
              {!declining ? (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setConfirmAccept(true)} disabled={respondStatus === "loading"}>
                    Accept Contract
                  </Button>
                  <Button variant="outline" onClick={() => setDeclining(true)} disabled={respondStatus === "loading"}>
                    Decline
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="decline-reason">Reason (optional)</Label>
                    <Textarea
                      id="decline-reason"
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

      {contract.status === "declined" && contract.declineReason && (
        <div className="rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <span className="font-medium">Decline reason: </span>
          {contract.declineReason}
        </div>
      )}

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Line Items</h3>
        <ContractLineItemsTable lineItems={contract.lineItems} />
      </div>

      {contract.notes && (
        <div>
          <h3 className="mb-2 font-heading text-sm font-semibold text-ink">Notes / Terms</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{contract.notes}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(contract.createdAt)}</dd>
        </div>
        {contract.sentAt && (
          <div>
            <dt className="text-xs text-ink-muted">Sent for Acceptance</dt>
            <dd className="text-ink">{formatDateTime(contract.sentAt)}</dd>
          </div>
        )}
        {contract.respondedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Responded</dt>
            <dd className="text-ink">{formatDateTime(contract.respondedAt)}</dd>
          </div>
        )}
      </dl>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Acceptance / Audit History</h3>
        <ContractAuditHistory entries={audit} />
      </div>

      <ConfirmationDialog
        open={confirmSend}
        onClose={() => setConfirmSend(false)}
        onConfirm={handleSend}
        title="Send for acceptance?"
        description="The customer will be able to review and accept or decline this contract. You won't be able to edit it while it's out for review — use Withdraw to Draft first if you need to."
        confirmLabel="Send"
        loading={sendStatus === "loading"}
        error={sendError}
      />
      <ConfirmationDialog
        open={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
        onConfirm={handleWithdraw}
        title="Withdraw to draft?"
        description="This recalls the contract from the customer's view so you can revise it. They'll no longer be able to respond until you send it again."
        confirmLabel="Withdraw"
        loading={withdrawStatus === "loading"}
        error={withdrawError}
      />
      <ConfirmationDialog
        open={confirmAccept}
        onClose={() => setConfirmAccept(false)}
        onConfirm={handleAccept}
        title="Accept this contract?"
        description="Once accepted, this contract becomes read-only for both you and BrickBasket."
        confirmLabel="Accept"
        loading={respondStatus === "loading"}
        error={respondError}
      />
    </div>
  );
}

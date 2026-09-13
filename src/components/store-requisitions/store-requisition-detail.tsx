"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/domain/status-badge";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import {
  useStoreRequisition,
  useSubmitStoreRequisition,
  useDecideStoreRequisition,
  useIssueStoreRequisition,
} from "@/hooks/use-store-requisitions";
import { useProject } from "@/hooks/use-projects";
import { StoreRequisitionForm } from "@/components/store-requisitions/store-requisition-form";
import { StoreRequisitionStatusTimeline } from "@/components/store-requisitions/store-requisition-status-timeline";
import { STORE_REQUISITION_STATUS_CONFIG } from "@/components/store-requisitions/store-requisition-status-config";
import { stockMaterialLabel } from "@/components/stock/stock-material-config";
import { formatDate, formatDateTime } from "@/lib/utils/format";

/**
 * Read + action surface for a single Store Material Requisition, used by
 * `/admin/stores/requisitions/[id]`. No customer-facing counterpart — §6B
 * names Stores/Site Project Manager only. Edit happens inline via a
 * `Dialog` (reusing `StoreRequisitionForm`) rather than a dedicated
 * `/edit` route — see that form's header comment for why.
 */
export function StoreRequisitionDetail({ requisitionId }: { requisitionId: string }) {
  const { session } = useSession();
  const { status, error, requisition, refetch } = useStoreRequisition(requisitionId);
  const { submit: submitRequisition, status: submitStatus, error: submitError } = useSubmitStoreRequisition();
  const { submit: decide, status: decideStatus, error: decideError } = useDecideStoreRequisition();
  const { submit: issueRequisition, status: issueStatus, error: issueError } = useIssueStoreRequisition();
  // Called unconditionally, before the loading/error early returns below —
  // see the identical Rules-of-Hooks note in `RequisitionDetail`/`RFQDetail`.
  const { project } = useProject(requisition?.projectId ?? null);

  const [editing, setEditing] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvedQty, setApprovedQty] = useState("");
  const [storeRemarks, setStoreRemarks] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

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
    return <ErrorState title="Could not load this request" description={error ?? undefined} onRetry={refetch} />;
  }

  const actor = session ? { id: session.user.id, name: session.user.name } : null;

  // Every handler guards on the mutation's return value before closing a
  // panel/dialog — the Phase 13 fix, applied from the start here rather
  // than needing a later pass. See docs/OPEN_QUESTIONS.md #45.
  const handleSubmit = async () => {
    if (!actor) return;
    const updated = await submitRequisition(requisition.id, actor);
    if (!updated) return;
    setConfirmSubmit(false);
    refetch();
  };

  const handleApprove = async () => {
    if (!actor) return;
    const qty = Number(approvedQty);
    const updated = await decide(requisition.id, "approved", { approvedIssuedQuantity: qty, storeRemarks: storeRemarks.trim() || undefined }, actor);
    if (!updated) return;
    setApproving(false);
    setApprovedQty("");
    setStoreRemarks("");
    refetch();
  };

  const handleReject = async () => {
    if (!actor) return;
    const updated = await decide(requisition.id, "rejected", { storeRemarks: rejectRemarks.trim() || undefined }, actor);
    if (!updated) return;
    setRejecting(false);
    setRejectRemarks("");
    refetch();
  };

  const handleIssue = async () => {
    if (!actor) return;
    const updated = await issueRequisition(requisition.id, actor);
    if (!updated) return;
    setConfirmIssue(false);
    refetch();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{requisition.requisitionNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">{project?.name ?? "Store Material Requisition"}</h2>
          <p className="text-sm text-ink-muted">Requested by {requisition.requestedByName} on {formatDate(requisition.requestDate)}</p>
        </div>
        <StatusBadge status={requisition.status} config={STORE_REQUISITION_STATUS_CONFIG} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <StoreRequisitionStatusTimeline status={requisition.status} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Material</dt>
            <dd className="mt-1 text-sm text-ink">{stockMaterialLabel(requisition.material, requisition.otherMaterialName)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Requested Quantity</dt>
            <dd className="mt-1 text-sm text-ink">{requisition.requestedQuantity} {requisition.uom}</dd>
          </div>
          {requisition.approvedIssuedQuantity !== undefined && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {requisition.status === "issued" ? "Issued Quantity" : "Approved to Issue"}
              </dt>
              <dd className="mt-1 text-sm text-ink">{requisition.approvedIssuedQuantity} {requisition.uom}</dd>
            </div>
          )}
          {requisition.issueDate && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">Issue Date</dt>
              <dd className="mt-1 text-sm text-ink">{formatDate(requisition.issueDate)}</dd>
            </div>
          )}
        </CardContent>
      </Card>

      {requisition.remarks && (
        <div>
          <h3 className="mb-2 font-heading text-sm font-semibold text-ink">Requester&apos;s Remarks</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{requisition.remarks}</p>
        </div>
      )}

      {requisition.storeRemarks && (
        <div>
          <h3 className="mb-2 font-heading text-sm font-semibold text-ink">Stores&apos; Remarks</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{requisition.storeRemarks}</p>
        </div>
      )}

      <PermissionGuard permission="store_requisitions:create">
        <div className="flex flex-wrap gap-2">
          {(requisition.status === "draft" || requisition.status === "rejected") && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              {requisition.status === "rejected" ? "Revise Request" : "Edit Request"}
            </Button>
          )}
          {requisition.status === "draft" && (
            <Button onClick={() => setConfirmSubmit(true)} disabled={submitStatus === "loading"}>
              Submit to Stores
            </Button>
          )}
        </div>
      </PermissionGuard>

      {requisition.status === "submitted" && (
        <PermissionGuard permission="store_requisitions:action">
          <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
              <p className="text-sm text-ink-muted">Decide how much of this request Stores can actually issue, then approve or reject.</p>
              {decideError && <p className="text-sm text-error">{decideError}</p>}
              {!approving && !rejecting && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setApproving(true)} disabled={decideStatus === "loading"}>
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => setRejecting(true)} disabled={decideStatus === "loading"}>
                    Reject
                  </Button>
                </div>
              )}
              {approving && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="approved-qty">
                      Quantity to issue ({requisition.uom}) <span className="text-error">*</span>
                    </Label>
                    <Input
                      id="approved-qty"
                      type="number"
                      step="any"
                      className="mt-1.5"
                      value={approvedQty}
                      onChange={(e) => setApprovedQty(e.target.value)}
                      placeholder={String(requisition.requestedQuantity)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-remarks">Remarks (optional)</Label>
                    <Textarea
                      id="store-remarks"
                      className="mt-1.5"
                      value={storeRemarks}
                      onChange={(e) => setStoreRemarks(e.target.value)}
                      placeholder="E.g. partial stock, balance to follow…"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setApproving(false)} disabled={decideStatus === "loading"}>
                      Cancel
                    </Button>
                    <Button onClick={handleApprove} disabled={decideStatus === "loading" || !approvedQty}>
                      Confirm Approve
                    </Button>
                  </div>
                </div>
              )}
              {rejecting && (
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="reject-remarks">Reason (optional)</Label>
                    <Textarea
                      id="reject-remarks"
                      className="mt-1.5"
                      value={rejectRemarks}
                      onChange={(e) => setRejectRemarks(e.target.value)}
                      placeholder="Let the requester know why, or what to do instead…"
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

      {requisition.status === "approved" && (
        <PermissionGuard permission="store_requisitions:action">
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setConfirmIssue(true)} disabled={issueStatus === "loading"}>
              Record Issuance
            </Button>
          </div>
        </PermissionGuard>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(requisition.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Last Updated</dt>
          <dd className="text-ink">{formatDateTime(requisition.updatedAt)}</dd>
        </div>
      </dl>

      <Dialog open={editing} onClose={() => setEditing(false)} title={requisition.status === "rejected" ? "Revise Request" : "Edit Request"}>
        <StoreRequisitionForm
          mode="edit"
          requisition={requisition}
          onCancel={() => setEditing(false)}
          onSuccess={() => {
            setEditing(false);
            refetch();
          }}
        />
      </Dialog>

      <ConfirmationDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit to Stores?"
        description="Once submitted, you won't be able to edit this request until Stores decides — or it's reset to draft if rejected."
        confirmLabel="Submit"
        loading={submitStatus === "loading"}
        error={submitError}
      />
      <ConfirmationDialog
        open={confirmIssue}
        onClose={() => setConfirmIssue(false)}
        onConfirm={handleIssue}
        title="Record this as issued?"
        description={`This marks ${requisition.approvedIssuedQuantity ?? "the approved quantity"} ${requisition.uom} as handed over to the site. It does not automatically update the Stock Statement ledger — reconcile that separately.`}
        confirmLabel="Record Issuance"
        loading={issueStatus === "loading"}
        error={issueError}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Pencil, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/domain/status-badge";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useSession } from "@/components/providers/auth-provider";
import {
  usePurchaseOrder,
  useUpdatePurchaseOrder,
  useSubmitPurchaseOrder,
  useDecideLevel1,
  useDecideLevel2,
  useReleasePurchaseOrder,
  useIssuePurchaseOrder,
} from "@/hooks/use-purchase-orders";
import { ApprovalTimeline } from "@/components/po/approval-timeline";
import { POLineItemsTable } from "@/components/po/po-line-items-table";
import { POAuditHistory } from "@/components/po/po-audit-history";
import { PO_STATUS_CONFIG } from "@/components/po/po-status-config";
import { useGRNs } from "@/hooks/use-grn";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

/**
 * Read + action surface for a single Purchase Order, used by
 * `/admin/purchase-orders/[id]`. No customer-facing counterpart — the owner
 * requirements don't call for one, same as Requisitions (Part 8) and RFQs
 * (Part 9).
 */
export function PODetail({
  purchaseOrderId,
  onOpenRFQ,
  onOpenGRN,
}: {
  purchaseOrderId: string;
  onOpenRFQ?: (rfqId: string) => void;
  onOpenGRN?: (grnId: string) => void;
}) {
  const router = useRouter();
  const { session } = useSession();
  const canPrepare = usePermission("po:create");

  const { status, error, purchaseOrder, lineItems, approvals, audit, refetch } = usePurchaseOrder(purchaseOrderId);
  const { result: grnLookup } = useGRNs({ purchaseOrderId, pageSize: 50 });

  const { submit: updatePO, status: updateStatus, error: updateError } = useUpdatePurchaseOrder();
  const { submit: submitPO, status: submitStatus } = useSubmitPurchaseOrder();
  const { submit: decideL1, status: decideL1Status, error: decideL1Error } = useDecideLevel1();
  const { submit: decideL2, status: decideL2Status, error: decideL2Error } = useDecideLevel2();
  const { submit: release, status: releaseStatus } = useReleasePurchaseOrder();
  const { submit: issue, status: issueStatus } = useIssuePurchaseOrder();
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];

  const [editing, setEditing] = useState(false);
  const [termsInput, setTermsInput] = useState("");
  const [taxInput, setTaxInput] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [decidingLevel, setDecidingLevel] = useState<1 | 2 | null>(null);
  const [decidingAction, setDecidingAction] = useState<"approved" | "rejected" | null>(null);
  const [decisionComment, setDecisionComment] = useState("");

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-1/2" />
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "error" || !purchaseOrder) {
    return <ErrorState title="Could not load this Purchase Order" description={error ?? undefined} onRetry={refetch} />;
  }

  const actor = session ? { id: session.user.id, name: session.user.name } : null;
  const project = allProjects.find((p) => p.id === purchaseOrder.projectId);
  const vendor = allVendors.find((v) => v.id === purchaseOrder.vendorId);
  const canEditTerms = canPrepare && (purchaseOrder.status === "draft" || purchaseOrder.status === "rejected");
  const decidingStatus = decidingLevel === 1 ? decideL1Status : decideL2Status;
  const decidingError = decidingLevel === 1 ? decideL1Error : decideL2Error;
  const lastRejection = [...approvals].reverse().find((a) => a.decision === "rejected");

  const handleStartEdit = () => {
    setTermsInput(purchaseOrder.termsAndConditions);
    setTaxInput(String(purchaseOrder.taxPercent));
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!actor) return;
    const taxValue = Number(taxInput);
    if (Number.isNaN(taxValue)) return;
    const result = await updatePO(purchaseOrder.id, { termsAndConditions: termsInput, taxPercent: taxValue }, actor);
    if (result) {
      setEditing(false);
      refetch();
    }
  };

  const handleSubmit = async () => {
    if (!actor) return;
    const result = await submitPO(purchaseOrder.id, actor);
    if (result) {
      setConfirmSubmit(false);
      refetch();
    }
  };

  const openDecision = (level: 1 | 2, decisionAction: "approved" | "rejected") => {
    setDecidingLevel(level);
    setDecidingAction(decisionAction);
    setDecisionComment("");
  };

  const closeDecision = () => {
    setDecidingLevel(null);
    setDecidingAction(null);
  };

  const handleConfirmDecision = async () => {
    if (!actor || !decidingLevel || !decidingAction) return;
    const fn = decidingLevel === 1 ? decideL1 : decideL2;
    const result = await fn(purchaseOrder.id, decidingAction, actor, decisionComment.trim() || undefined);
    if (result) {
      closeDecision();
      setDecisionComment("");
      refetch();
    }
  };

  const handleRelease = async () => {
    if (!actor) return;
    const result = await release(purchaseOrder.id, actor);
    if (result) {
      setConfirmRelease(false);
      refetch();
    }
  };

  const handleIssue = async () => {
    if (!actor) return;
    const result = await issue(purchaseOrder.id, actor);
    if (result) {
      setConfirmIssue(false);
      refetch();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{purchaseOrder.poNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">{project?.name ?? "Purchase Order"}</h2>
          <p className="text-sm text-ink-muted">
            {vendor?.tradeName ?? "Unknown vendor"} · Prepared by {purchaseOrder.preparedByName}
            {onOpenRFQ && (
              <>
                {" · "}
                <button type="button" className="text-brand-red underline-offset-2 hover:underline" onClick={() => onOpenRFQ(purchaseOrder.rfqId)}>
                  View source RFQ
                </button>
              </>
            )}
          </p>
        </div>
        <StatusBadge status={purchaseOrder.status} config={PO_STATUS_CONFIG} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <ApprovalTimeline status={purchaseOrder.status} rejectedAtLevel={purchaseOrder.rejectedAtLevel} />
        </CardContent>
      </Card>

      {purchaseOrder.status === "rejected" && (
        <div className="rounded-md border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <span className="font-medium">Rejected at level {purchaseOrder.rejectedAtLevel}. </span>
          {lastRejection?.comment ?? "No reason was recorded."}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-heading text-sm font-semibold text-ink">Terms &amp; Conditions</h3>
            {canEditTerms && !editing && (
              <Button variant="outline" size="sm" onClick={handleStartEdit}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </Button>
            )}
          </div>
          {!editing ? (
            <p className="whitespace-pre-wrap text-sm text-ink">{purchaseOrder.termsAndConditions || "No terms recorded yet."}</p>
          ) : (
            <div className="flex flex-col gap-3">
              <Textarea rows={5} value={termsInput} onChange={(e) => setTermsInput(e.target.value)} aria-label="Terms and conditions" />
              <div className="flex items-center gap-2">
                <Label htmlFor="po-tax" className="shrink-0">
                  Applicable Tax (%)
                </Label>
                <Input id="po-tax" type="number" step="any" value={taxInput} onChange={(e) => setTaxInput(e.target.value)} className="h-9 w-24" />
              </div>
              {updateError && <p className="text-xs text-error">{updateError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateStatus === "loading"}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={updateStatus === "loading"}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Line Items</h3>
        <POLineItemsTable lineItems={lineItems} taxPercent={purchaseOrder.taxPercent} />
      </div>

      {purchaseOrder.status === "issued" && (
        <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm text-ink-muted">
          <Mail className="h-4 w-4 shrink-0 text-success" aria-hidden />
          Email dispatch: <span className="font-medium text-ink">{purchaseOrder.emailDispatchStatus === "sent" ? "Sent" : purchaseOrder.emailDispatchStatus}</span>
          {purchaseOrder.emailDispatchedAt && <span>· {formatDateTime(purchaseOrder.emailDispatchedAt)}</span>}
        </div>
      )}

      {purchaseOrder.status === "issued" && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-ink-muted" aria-hidden />
                <h3 className="font-heading text-sm font-semibold text-ink">Goods Receipt Notes</h3>
              </div>
              <PermissionGuard permission="grn:create">
                <Button variant="outline" size="sm" onClick={() => router.push(`${ADMIN_ROUTES.grn}/new?poId=${purchaseOrder.id}`)}>
                  Record GRN
                </Button>
              </PermissionGuard>
            </div>
            {(grnLookup?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-ink-muted">No goods have been received against this PO yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(grnLookup?.items ?? []).map((grn) => (
                  <li key={grn.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <span className="text-ink">
                      {grn.grnNumber} · Received {formatDate(grn.receivedAt)}
                    </span>
                    <PermissionGuard permission="grn:read">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => (onOpenGRN ? onOpenGRN(grn.id) : router.push(`${ADMIN_ROUTES.grn}/${grn.id}`))}
                      >
                        View GRN
                      </Button>
                    </PermissionGuard>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {purchaseOrder.status === "draft" && (
        <PermissionGuard permission="po:create">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-ink-muted">Submit this PO for level 1 approval once terms are ready.</p>
              <Button onClick={() => setConfirmSubmit(true)} disabled={submitStatus === "loading"}>
                Submit for Approval
              </Button>
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {purchaseOrder.status === "pending_approval_l1" && (
        <PermissionGuard permission="po:approve:level1">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-ink-muted">Awaiting level 1 approval.</p>
              <div className="flex gap-2">
                <Button onClick={() => openDecision(1, "approved")}>Approve</Button>
                <Button variant="outline" onClick={() => openDecision(1, "rejected")}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {purchaseOrder.status === "pending_approval_l2" && (
        <PermissionGuard permission="po:approve:level2">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-ink-muted">Awaiting level 2 approval.</p>
              <div className="flex gap-2">
                <Button onClick={() => openDecision(2, "approved")}>Approve</Button>
                <Button variant="outline" onClick={() => openDecision(2, "rejected")}>
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {purchaseOrder.status === "approved" && (
        <PermissionGuard permission="po:issue">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-ink-muted">Fully approved — release it to move toward issuance.</p>
              <Button onClick={() => setConfirmRelease(true)} disabled={releaseStatus === "loading"}>
                Release
              </Button>
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {purchaseOrder.status === "released" && (
        <PermissionGuard permission="po:issue">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-ink-muted">Released — issue it to dispatch the PO to the vendor.</p>
              <Button onClick={() => setConfirmIssue(true)} disabled={issueStatus === "loading"}>
                Issue
              </Button>
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {approvals.length > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Approval Decisions</h3>
          <ul className="flex flex-col gap-2">
            {approvals.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <Badge variant={a.decision === "approved" ? "success" : "error"}>
                  Level {a.level} · {a.decision === "approved" ? "Approved" : "Rejected"}
                </Badge>
                <span className="text-ink">{a.decidedByName}</span>
                <span className="text-ink-muted">· {formatDateTime(a.decidedAt)}</span>
                {a.comment && <span className="text-ink-muted">— {a.comment}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">History</h3>
        <POAuditHistory entries={audit} />
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(purchaseOrder.createdAt)}</dd>
        </div>
        {purchaseOrder.submittedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Submitted</dt>
            <dd className="text-ink">{formatDateTime(purchaseOrder.submittedAt)}</dd>
          </div>
        )}
        {purchaseOrder.releasedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Released</dt>
            <dd className="text-ink">{formatDateTime(purchaseOrder.releasedAt)}</dd>
          </div>
        )}
        {purchaseOrder.issuedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Issued</dt>
            <dd className="text-ink">{formatDateTime(purchaseOrder.issuedAt)}</dd>
          </div>
        )}
      </dl>

      <ConfirmationDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={handleSubmit}
        title="Submit for approval?"
        description="This locks the terms and sends the PO into the two-level approval workflow."
        confirmLabel="Submit"
        loading={submitStatus === "loading"}
      />
      <ConfirmationDialog
        open={confirmRelease}
        onClose={() => setConfirmRelease(false)}
        onConfirm={handleRelease}
        title="Release this Purchase Order?"
        description="Marks it ready to be issued to the vendor."
        confirmLabel="Release"
        loading={releaseStatus === "loading"}
      />
      <ConfirmationDialog
        open={confirmIssue}
        onClose={() => setConfirmIssue(false)}
        onConfirm={handleIssue}
        title="Issue this Purchase Order?"
        description="Dispatches the PO to the vendor by email (mocked) and marks it issued."
        confirmLabel="Issue"
        loading={issueStatus === "loading"}
      />

      <Dialog open={decidingLevel !== null} onClose={closeDecision} title={decidingAction === "approved" ? `Approve at level ${decidingLevel}?` : `Reject at level ${decidingLevel}?`}>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="decision-comment">Comment (optional)</Label>
            <Textarea
              id="decision-comment"
              className="mt-1.5"
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              placeholder={decidingAction === "rejected" ? "Let the preparer know what needs to change…" : "Any notes for the record…"}
            />
          </div>
          {decidingError && <p className="text-sm text-error">{decidingError}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDecision} disabled={decidingStatus === "loading"}>
              Cancel
            </Button>
            <Button variant={decidingAction === "rejected" ? "secondary" : "primary"} onClick={handleConfirmDecision} disabled={decidingStatus === "loading"}>
              Confirm {decidingAction === "approved" ? "Approve" : "Reject"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

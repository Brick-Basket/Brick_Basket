"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/domain/status-badge";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ConfirmationDialog } from "@/components/domain/confirmation-dialog";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useSession } from "@/components/providers/auth-provider";
import { useRFQ, useSetVendorQuote, useRemoveVendorQuote, useSelectVendor, useFinalizeRFQ, useUpdateRFQ } from "@/hooks/use-rfq";
import { useVendors } from "@/hooks/use-vendors";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { RFQComparisonTable } from "@/components/rfq/rfq-comparison-table";
import { RFQVendorQuoteForm } from "@/components/rfq/rfq-vendor-quote-form";
import { RFQ_STATUS_CONFIG } from "@/components/rfq/rfq-status-config";
import { PO_STATUS_CONFIG } from "@/components/po/po-status-config";
import { formatDateTime } from "@/lib/utils/format";
import { useProject } from "@/hooks/use-projects";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { RFQVendorQuote } from "@/types/domain/rfq";
import type { Vendor } from "@/types/domain/vendor";

/** Read + comparison surface for a single RFQ, used by `/admin/supply-chain/rfqs/[id]`. No customer-facing counterpart — the owner requirements don't call for one, same as Requisitions (Part 8). */
export function RFQDetail({
  rfqId,
  onOpenRequisition,
  onOpenPurchaseOrder,
}: {
  rfqId: string;
  onOpenRequisition?: (requisitionId: string) => void;
  onOpenPurchaseOrder?: (purchaseOrderId: string) => void;
}) {
  const router = useRouter();
  const { session } = useSession();
  const canEdit = usePermission("rfq:compare");
  const { status, error, rfq, lines, quotes, refetch } = useRFQ(rfqId);
  const { result: vendorsResult } = useVendors({ page: 1, pageSize: 200, sortBy: "tradeName", sortDir: "asc" });
  // Backs the per-vendor-group "Create PO" / "View PO" links below — wires
  // the explicit RFQ → Purchase Order hand-off (Part 10) the same way
  // Part 9 wired Requisition → RFQ.
  const { result: poLookup } = usePurchaseOrders({ rfqId, pageSize: 50 });

  const { submit: setQuote, status: setQuoteStatus, error: setQuoteError, } = useSetVendorQuote();
  const { submit: removeQuote, status: removeQuoteStatus, error: removeQuoteError } = useRemoveVendorQuote();
  const { submit: selectVendor, status: selectVendorStatus, error: selectVendorError } = useSelectVendor();
  const { submit: finalize, status: finalizeStatus, error: finalizeError } = useFinalizeRFQ();
  const { submit: updateTax, status: updateTaxStatus, error: updateTaxError } = useUpdateRFQ();

  const [addingQuoteForLine, setAddingQuoteForLine] = useState<string | null>(null);
  const [confirmFinalize, setConfirmFinalize] = useState(false);
  const [editingTax, setEditingTax] = useState(false);
  const [taxInput, setTaxInput] = useState("");
  // Called unconditionally, before the loading/error early returns below —
  // `rfq` may still be undefined on the first render (Rules of Hooks).
  const { project } = useProject(rfq?.projectId ?? null);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-1/2" />
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "error" || !rfq) {
    return <ErrorState title="Could not load this RFQ" description={error ?? undefined} onRetry={refetch} />;
  }

  const actor = session ? { id: session.user.id, name: session.user.name } : null;
  const vendors = vendorsResult?.items ?? [];
  const vendorsById: Record<string, Vendor> = {};
  for (const v of vendors) vendorsById[v.id] = v;

  const quotesByLine: Record<string, RFQVendorQuote[]> = {};
  for (const q of quotes) {
    (quotesByLine[q.rfqLineId] ??= []).push(q);
  }

  const allLinesSelected = lines.length > 0 && lines.every((l) => l.selectedVendorId);
  const busy = setQuoteStatus === "loading" || removeQuoteStatus === "loading" || selectVendorStatus === "loading";

  // Distinct vendor groups among this RFQ's selected lines — one Purchase
  // Order per group (Part 10), never one PO per RFQ. Computed here rather
  // than stored, same "computed-not-stored" approach as the comparison
  // table's derived figures.
  const vendorGroups: { vendorId: string; lineCount: number }[] = [];
  if (rfq.status === "finalized") {
    const counts = new Map<string, number>();
    for (const l of lines) {
      if (!l.selectedVendorId) continue;
      counts.set(l.selectedVendorId, (counts.get(l.selectedVendorId) ?? 0) + 1);
    }
    for (const [vendorId, lineCount] of counts) vendorGroups.push({ vendorId, lineCount });
  }
  const activeLine = addingQuoteForLine ? lines.find((l) => l.id === addingQuoteForLine) : undefined;
  const activeLineQuotedVendorIds = new Set((activeLine ? quotesByLine[activeLine.id] : [])?.map((q) => q.vendorId) ?? []);
  const availableVendorsForActiveLine = vendors.filter((v) => !activeLineQuotedVendorIds.has(v.id));

  const handleAddQuote = async (values: { vendorId: string; rate: number }) => {
    if (!actor || !addingQuoteForLine) return;
    const result = await setQuote(rfq.id, addingQuoteForLine, values.vendorId, values.rate, actor);
    if (result) {
      setAddingQuoteForLine(null);
      refetch();
    }
  };

  // FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
  // 13): guarded on the mutation's return value, same as every other action
  // in this pass — a failed remove/select used to refetch unconditionally,
  // which isn't a false-success (nothing closes/navigates here) but did
  // silently swallow the error. `removeQuoteError`/`selectVendorError` are
  // now surfaced in the comparison table header, see below.
  const handleRemoveQuote = async (lineId: string, vendorId: string) => {
    if (!actor) return;
    const result = await removeQuote(rfq.id, lineId, vendorId, actor);
    if (result) refetch();
  };

  const handleSelectVendor = async (lineId: string, vendorId: string | null) => {
    if (!actor) return;
    const result = await selectVendor(rfq.id, lineId, vendorId, actor);
    if (result) refetch();
  };

  const handleFinalize = async () => {
    if (!actor) return;
    const result = await finalize(rfq.id, actor);
    if (result) {
      setConfirmFinalize(false);
      refetch();
    }
  };

  const handleSaveTax = async () => {
    if (!actor) return;
    const value = Number(taxInput);
    if (Number.isNaN(value)) return;
    const result = await updateTax(rfq.id, { taxPercent: value }, actor);
    if (result) {
      setEditingTax(false);
      refetch();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{rfq.rfqNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">{project?.name ?? "RFQ"}</h2>
          <p className="text-sm text-ink-muted">
            Prepared by {rfq.preparedByName}
            {onOpenRequisition && (
              <>
                {" · "}
                <button type="button" className="text-brand-red underline-offset-2 hover:underline" onClick={() => onOpenRequisition(rfq.requisitionId)}>
                  View source requisition
                </button>
              </>
            )}
          </p>
        </div>
        <StatusBadge status={rfq.status} config={RFQ_STATUS_CONFIG} />
      </div>

      <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-ink-muted">
        <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
        All rates, amounts and savings in this comparison are demo/mock values for UI demonstration only — not real client or vendor pricing.
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-xs text-ink-muted">Applicable Tax</p>
            {!editingTax ? (
              <p className="text-ink">{rfq.taxPercent}%</p>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type="number"
                  step="any"
                  value={taxInput}
                  onChange={(e) => setTaxInput(e.target.value)}
                  className="h-9 w-24"
                  aria-label="Applicable tax percent"
                />
                <Button size="sm" onClick={handleSaveTax} disabled={updateTaxStatus === "loading"}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingTax(false)} disabled={updateTaxStatus === "loading"}>
                  Cancel
                </Button>
              </div>
            )}
            {updateTaxError && <p className="mt-1 text-xs text-error">{updateTaxError}</p>}
          </div>
          {canEdit && rfq.status === "draft" && !editingTax && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTaxInput(String(rfq.taxPercent));
                setEditingTax(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Edit Tax
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Quote Comparison</h3>
        {(removeQuoteError || selectVendorError) && (
          <p role="alert" className="mb-3 text-sm text-error">
            {removeQuoteError || selectVendorError}
          </p>
        )}
        <RFQComparisonTable
          rfq={rfq}
          lines={lines}
          quotesByLine={quotesByLine}
          vendorsById={vendorsById}
          canEdit={canEdit && rfq.status === "draft"}
          onAddQuoteClick={setAddingQuoteForLine}
          onRemoveQuote={handleRemoveQuote}
          onSelectVendor={handleSelectVendor}
          busy={busy}
        />
      </div>

      {rfq.status === "draft" && (
        <PermissionGuard permission="rfq:compare">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm text-ink-muted">
                {allLinesSelected
                  ? "Every line has a selected vendor — ready to finalize."
                  : "Select a vendor for every line above before finalizing."}
              </p>
              {finalizeError && <p className="text-sm text-error">{finalizeError}</p>}
              <Button onClick={() => setConfirmFinalize(true)} disabled={!allLinesSelected || finalizeStatus === "loading"}>
                Finalize RFQ
              </Button>
            </CardContent>
          </Card>
        </PermissionGuard>
      )}

      {rfq.status === "finalized" && vendorGroups.length > 0 && (
        <div>
          <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Purchase Orders</h3>
          <div className="flex flex-col gap-2">
            {vendorGroups.map((group) => {
              const existingPO = (poLookup?.items ?? []).find((po) => po.vendorId === group.vendorId);
              const vendor = vendorsById[group.vendorId];
              return (
                <Card key={group.vendorId}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                    <div>
                      <p className="font-medium text-ink">{vendor?.tradeName ?? "Unknown vendor"}</p>
                      <p className="text-xs text-ink-muted">
                        {group.lineCount} line{group.lineCount === 1 ? "" : "s"} selected
                      </p>
                    </div>
                    {existingPO ? (
                      <div className="flex items-center gap-2">
                        <StatusBadge status={existingPO.status} config={PO_STATUS_CONFIG} />
                        <PermissionGuard permission="po:read">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onOpenPurchaseOrder ? onOpenPurchaseOrder(existingPO.id) : router.push(`${ADMIN_ROUTES.purchaseOrders}/${existingPO.id}`)
                            }
                          >
                            View PO
                          </Button>
                        </PermissionGuard>
                      </div>
                    ) : (
                      <PermissionGuard permission="po:create">
                        <Button size="sm" onClick={() => router.push(`${ADMIN_ROUTES.purchaseOrders}/new?rfqId=${rfq.id}&vendorId=${group.vendorId}`)}>
                          Create PO
                        </Button>
                      </PermissionGuard>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-ink-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(rfq.createdAt)}</dd>
        </div>
        {rfq.finalizedAt && (
          <div>
            <dt className="text-xs text-ink-muted">Finalized</dt>
            <dd className="text-ink">{formatDateTime(rfq.finalizedAt)}</dd>
          </div>
        )}
      </dl>

      <Dialog open={!!addingQuoteForLine} onClose={() => setAddingQuoteForLine(null)} title="Add Vendor Quote" description={activeLine?.description}>
        <RFQVendorQuoteForm
          availableVendors={availableVendorsForActiveLine}
          onCancel={() => setAddingQuoteForLine(null)}
          onSubmit={handleAddQuote}
          submitting={setQuoteStatus === "loading"}
          error={setQuoteError}
        />
      </Dialog>

      <ConfirmationDialog
        open={confirmFinalize}
        onClose={() => setConfirmFinalize(false)}
        onConfirm={handleFinalize}
        title="Finalize this RFQ?"
        description="Locks the comparison and its vendor selections — Purchase Orders (Part 10) picks up from here. Quotes and selections can no longer be changed afterward."
        confirmLabel="Finalize"
        loading={finalizeStatus === "loading"}
      />
    </div>
  );
}

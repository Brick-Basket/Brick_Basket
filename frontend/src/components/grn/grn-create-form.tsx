"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { usePurchaseOrders, usePurchaseOrder } from "@/hooks/use-purchase-orders";
import { useCreateGRN, useAllGRNLineItems } from "@/hooks/use-grn";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import { STOCK_MATERIAL_CONFIG, STOCK_MATERIAL_ORDER } from "@/components/stock/stock-material-config";
import type { StockMaterial } from "@/types/domain/stock-entry";

interface LineDraft {
  purchaseOrderLineItemId: string;
  description: string;
  uom: string;
  orderedQuantity: number;
  rate: number;
  /** Sum of `receivedQuantity` already recorded against this PO line across every earlier GRN — see `alreadyReceivedByPoLineId` below. */
  alreadyReceivedQuantity: number;
  receivedQuantity: string;
  brand: string;
  warrantyCertificateNumber: string;
  /** Opt-in tag into the Stock Statement reconciliation view (`StockTrace`) — see docs/OPEN_QUESTIONS.md #32. Empty string means "not tagged." */
  stockMaterial: StockMaterial | "";
}

/**
 * Records a GRN against an issued Purchase Order. Reads `?poId=` (set by
 * the PO detail page's "Record GRN" link) to pre-select the PO; falls
 * back to a picker over every currently-issued PO otherwise. Owns its
 * own navigation, same pattern as `POCreateForm`/`RFQCreateForm`.
 */
export function GRNCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poIdParam = searchParams.get("poId");

  const { session } = useSession();
  const { status: issuedStatus, result: issuedResult } = usePurchaseOrders({ status: "issued", pageSize: 50 });
  const [selectedPoId, setSelectedPoId] = useState(poIdParam ?? "");

  // BUG FIX (owner report: the generic "Record GRN" entry point — no
  // `?poId=` — landed on the form with a PREVIOUS Purchase Order already
  // selected, one that could be fully received already). `useState(poIdParam
  // ?? "")` only reads `poIdParam` on this component's FIRST mount. Next.js's
  // App Router does not remount `GRNCreateForm` on a search-params-only
  // navigation (e.g. leaving `/admin/stores/grn/new?poId=po_1` — reached from
  // a PO detail page's own "Record GRN" link — and then clicking the generic
  // "Record GRN" button, which goes to `/admin/stores/grn/new` with no query
  // string, both the same route): the component instance, and therefore its
  // `selectedPoId` state, is reused as-is. `poIdParam` itself updates to
  // `null` correctly, which is why the field stopped being `disabled` — but
  // the stale `selectedPoId` from the earlier visit was never cleared, so
  // the PO dropdown kept showing whatever PO the user had last opened a
  // pre-filled GRN form for, however unrelated (here, already fully
  // received). This effect keeps `selectedPoId` in sync with `poIdParam`
  // on every navigation into this page, not just the first: switching to a
  // PO-specific link re-selects that PO as before, and landing on the
  // generic link (poIdParam now absent) correctly clears back to the empty
  // "Select an issued Purchase Order…" placeholder instead of carrying over
  // whatever was selected last.
  useEffect(() => {
    setSelectedPoId(poIdParam ?? "");
  }, [poIdParam]);

  const { status: poStatus, purchaseOrder, lineItems: poLineItems } = usePurchaseOrder(selectedPoId || null);
  const { submit: createGRN, status: createStatus, error: createError } = useCreateGRN();
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const { lineItems: allGRNLineItems } = useAllGRNLineItems();

  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // BUG FIX (owner report: recording a GRN failed with "...150 already
  // received across other GRNs" on what looked, from this form alone,
  // like a fresh attempt). The real adapter-level over-receipt guard
  // (`GRNAdapter.create`) was always correct — the actual gap was here:
  // this form had no idea how much of a PO line had already been received
  // across earlier GRNs, so it always proposed the full *originally
  // ordered* quantity by default, every time the form was opened against
  // that PO — including a second visit after an earlier GRN had already
  // been recorded (e.g. navigating back to this page, or reopening
  // "Record GRN" from the PO detail page). Re-submitting that stale
  // default silently overshot what was actually still outstanding, and
  // the resulting error read as if the guard were miscounting rather than
  // correctly rejecting a genuine over-receipt. Summing every existing
  // `GRNLineItem` by `purchaseOrderLineItemId` here lets the form default
  // to the REMAINING quantity instead (never below zero) and show
  // "already received"/"fully received" context inline, so this is
  // visible up front rather than only discovered via a late submit error.
  const alreadyReceivedByPoLineId = useMemo(() => {
    const map = new Map<string, number>();
    for (const li of allGRNLineItems) {
      map.set(li.purchaseOrderLineItemId, (map.get(li.purchaseOrderLineItemId) ?? 0) + li.receivedQuantity);
    }
    return map;
  }, [allGRNLineItems]);

  useEffect(() => {
    if (poLineItems.length === 0) {
      setLines([]);
      return;
    }
    setLines(
      poLineItems.map((l) => {
        const alreadyReceived = alreadyReceivedByPoLineId.get(l.id) ?? 0;
        const remaining = Math.max(0, l.quantity - alreadyReceived);
        return {
          purchaseOrderLineItemId: l.id,
          description: l.description,
          uom: l.uom,
          orderedQuantity: l.quantity,
          rate: l.rate,
          alreadyReceivedQuantity: alreadyReceived,
          receivedQuantity: String(remaining),
          brand: "",
          warrantyCertificateNumber: "",
          stockMaterial: "",
        };
      }),
    );
    // Re-derive whenever a different PO's line items load, or once
    // already-received totals finish loading/change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoId, poLineItems.length, alreadyReceivedByPoLineId]);

  const updateLine = (id: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.purchaseOrderLineItemId === id ? { ...l, ...patch } : l)));
  };

  const issuedPOs = issuedResult?.items ?? [];

  if (issuedStatus === "loading") {
    return <LoadingSkeleton className="h-64 w-full" />;
  }

  if (!poIdParam && issuedPOs.length === 0) {
    return (
      <EmptyState
        title="No issued Purchase Orders yet"
        description="A GRN records what arrived against a Purchase Order the vendor has already been issued — issue one first."
        action={
          <Button variant="outline" onClick={() => router.push(ADMIN_ROUTES.purchaseOrders)}>
            View Purchase Orders
          </Button>
        }
      />
    );
  }

  const handleSubmit = async () => {
    if (!session) return;
    setFormError(null);
    if (!selectedPoId) {
      setFormError("Select a Purchase Order.");
      return;
    }
    if (!receivedAt) {
      setFormError("Select the date goods were received.");
      return;
    }
    const parsedLines = lines.map((l) => ({
      purchaseOrderLineItemId: l.purchaseOrderLineItemId,
      receivedQuantity: Number(l.receivedQuantity),
      brand: l.brand || undefined,
      warrantyCertificateNumber: l.warrantyCertificateNumber || undefined,
      stockMaterial: l.stockMaterial || undefined,
    }));
    if (parsedLines.some((l) => Number.isNaN(l.receivedQuantity) || l.receivedQuantity < 0)) {
      setFormError("Received quantity must be a non-negative number for every line.");
      return;
    }
    const created = await createGRN(
      { purchaseOrderId: selectedPoId, receivedAt: new Date(receivedAt).toISOString(), notes: notes || undefined, lines: parsedLines },
      { id: session.user.id, name: session.user.name },
    );
    if (created) router.push(`${ADMIN_ROUTES.grn}/${created.id}`);
  };

  const submitting = createStatus === "loading";
  const vendor = purchaseOrder ? allVendors.find((v) => v.id === purchaseOrder.vendorId) : undefined;
  const project = purchaseOrder ? allProjects.find((p) => p.id === purchaseOrder.projectId) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <FormField label="Purchase Order" htmlFor="grn-po" required hint={poIdParam ? "Pre-selected from the source Purchase Order." : undefined}>
        <Select id="grn-po" disabled={!!poIdParam} value={selectedPoId} onChange={(e) => setSelectedPoId(e.target.value)}>
          <option value="">Select an issued Purchase Order…</option>
          {issuedPOs.map((po) => (
            <option key={po.id} value={po.id}>
              {po.poNumber} — {allVendors.find((v) => v.id === po.vendorId)?.tradeName ?? "Unknown vendor"}
            </option>
          ))}
          {poIdParam && !issuedPOs.some((po) => po.id === poIdParam) && purchaseOrder && (
            <option value={purchaseOrder.id}>{purchaseOrder.poNumber}</option>
          )}
        </Select>
      </FormField>

      {selectedPoId && poStatus === "loading" && <LoadingSkeleton className="h-48 w-full" />}

      {/*
       * DEFENSE-IN-DEPTH FIX (broad audit pass): previously this component
       * rendered the full line-item/received-quantity form for ANY PO that
       * loaded here, and only discovered a non-issued source PO when
       * `GRNAdapter.create()` threw at submit time. The adapter guard
       * (grn-adapter.ts) already prevents an actual GRN from ever being
       * created against a non-issued PO, so this was never a functional
       * bug — but it was a real UX inconsistency with the sibling
       * `POCreateForm`, which checks `rfq.status !== "finalized"` and shows
       * a clear `ErrorState` *before* rendering any fields. A stale
       * bookmark, a PO whose status changed after a link was rendered, or
       * simply editing `?poId=` in the URL could all reach this state.
       */}
      {selectedPoId && poStatus === "success" && purchaseOrder && purchaseOrder.status !== "issued" && (
        <ErrorState
          title="This Purchase Order isn't ready for a GRN"
          description="Only an issued Purchase Order can have a GRN recorded against it."
        />
      )}

      {selectedPoId && poStatus === "success" && purchaseOrder && purchaseOrder.status === "issued" && (
        <>
          <div className="rounded-card border border-border bg-surface-muted p-4 text-sm">
            <p className="text-ink-muted">Project</p>
            <p className="font-medium text-ink">{project?.name ?? "—"}</p>
            <p className="mt-2 text-ink-muted">Vendor</p>
            <p className="font-medium text-ink">{vendor?.tradeName ?? "Unknown vendor"}</p>
          </div>

          <FormField label="Date Received" htmlFor="grn-received-at" required>
            <Input id="grn-received-at" type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
          </FormField>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-ink">Materials Ordered vs. Received</p>
            {lines.map((line) => (
              <div key={line.purchaseOrderLineItemId} className="rounded-card border border-border p-3">
                <p className="mb-1 text-sm font-medium text-ink">
                  {line.description} <span className="text-xs font-normal text-ink-muted">— ordered {line.orderedQuantity.toLocaleString("en-IN")} {line.uom} @ {formatINR(line.rate)}</span>
                </p>
                {line.alreadyReceivedQuantity > 0 && (
                  <p className="mb-2 text-xs text-ink-muted">
                    {line.alreadyReceivedQuantity >= line.orderedQuantity ? (
                      <>
                        Already fully received ({line.alreadyReceivedQuantity.toLocaleString("en-IN")} of{" "}
                        {line.orderedQuantity.toLocaleString("en-IN")} {line.uom}) across earlier GRNs on this PO —
                        recording more here would exceed what was ordered.
                      </>
                    ) : (
                      <>
                        {line.alreadyReceivedQuantity.toLocaleString("en-IN")} of {line.orderedQuantity.toLocaleString("en-IN")}{" "}
                        {line.uom} already received across earlier GRNs on this PO —{" "}
                        {(line.orderedQuantity - line.alreadyReceivedQuantity).toLocaleString("en-IN")} {line.uom} remaining.
                      </>
                    )}
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor={`grn-qty-${line.purchaseOrderLineItemId}`}>Received Quantity</Label>
                    <Input
                      id={`grn-qty-${line.purchaseOrderLineItemId}`}
                      type="number"
                      step="any"
                      className="mt-1.5"
                      value={line.receivedQuantity}
                      onChange={(e) => updateLine(line.purchaseOrderLineItemId, { receivedQuantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`grn-brand-${line.purchaseOrderLineItemId}`}>Brand</Label>
                    <Input
                      id={`grn-brand-${line.purchaseOrderLineItemId}`}
                      className="mt-1.5"
                      value={line.brand}
                      onChange={(e) => updateLine(line.purchaseOrderLineItemId, { brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`grn-warranty-${line.purchaseOrderLineItemId}`}>Warranty Certificate (optional)</Label>
                    <Input
                      id={`grn-warranty-${line.purchaseOrderLineItemId}`}
                      className="mt-1.5"
                      value={line.warrantyCertificateNumber}
                      onChange={(e) => updateLine(line.purchaseOrderLineItemId, { warrantyCertificateNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label htmlFor={`grn-stock-material-${line.purchaseOrderLineItemId}`}>Stock Material (optional)</Label>
                  <Select
                    id={`grn-stock-material-${line.purchaseOrderLineItemId}`}
                    className="mt-1.5"
                    value={line.stockMaterial}
                    onChange={(e) => updateLine(line.purchaseOrderLineItemId, { stockMaterial: e.target.value as StockMaterial | "" })}
                  >
                    <option value="">Not tagged — won&apos;t appear on the Stock Statement&apos;s reconciliation view</option>
                    {STOCK_MATERIAL_ORDER.map((m) => (
                      <option key={m} value={m}>
                        {STOCK_MATERIAL_CONFIG[m].label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <FormField label="Notes (optional)" htmlFor="grn-notes">
            <Textarea id="grn-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </>
      )}

      {(formError || createError) && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {formError ?? createError}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(ADMIN_ROUTES.grn)} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !selectedPoId || !purchaseOrder || purchaseOrder.status !== "issued"}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Record GRN
        </Button>
      </div>
    </div>
  );
}

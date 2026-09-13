"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/domain/empty-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { usePurchaseOrders, usePurchaseOrder } from "@/hooks/use-purchase-orders";
import { useCreateGRN } from "@/hooks/use-grn";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

interface LineDraft {
  purchaseOrderLineItemId: string;
  description: string;
  uom: string;
  orderedQuantity: number;
  rate: number;
  receivedQuantity: string;
  brand: string;
  warrantyCertificateNumber: string;
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
  const { status: poStatus, purchaseOrder, lineItems: poLineItems } = usePurchaseOrder(selectedPoId || null);
  const { submit: createGRN, status: createStatus, error: createError } = useCreateGRN();
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];

  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (poLineItems.length === 0) {
      setLines([]);
      return;
    }
    setLines(
      poLineItems.map((l) => ({
        purchaseOrderLineItemId: l.id,
        description: l.description,
        uom: l.uom,
        orderedQuantity: l.quantity,
        rate: l.rate,
        receivedQuantity: String(l.quantity),
        brand: "",
        warrantyCertificateNumber: "",
      })),
    );
    // Re-derive whenever a different PO's line items load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoId, poLineItems.length]);

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

      {selectedPoId && poStatus === "success" && purchaseOrder && (
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
                <p className="mb-2 text-sm font-medium text-ink">
                  {line.description} <span className="text-xs font-normal text-ink-muted">— ordered {line.orderedQuantity.toLocaleString("en-IN")} {line.uom} @ {formatINR(line.rate)}</span>
                </p>
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
        <Button type="button" onClick={handleSubmit} disabled={submitting || !selectedPoId}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Record GRN
        </Button>
      </div>
    </div>
  );
}

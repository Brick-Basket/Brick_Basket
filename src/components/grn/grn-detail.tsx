"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileBarChart, FileCheck2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useGRN, useUpdateGRN } from "@/hooks/use-grn";
import { useSession } from "@/components/providers/auth-provider";
import { GRNLineItemsTable } from "@/components/grn/grn-line-items-table";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

interface LineEdit {
  purchaseOrderLineItemId: string;
  description: string;
  uom: string;
  orderedQuantity: number;
  receivedQuantity: string;
  brand: string;
  warrantyCertificateNumber: string;
}

/**
 * Read + inline-edit surface for a single GRN, used by
 * `/admin/stores/grn/[id]`. Editing is kept inline (no dedicated
 * `/[id]/edit` route) — a GRN has no approval lifecycle, so its editable
 * surface (received quantities/brand/warranty/notes) is the same scale
 * as RFQ's/PO's single-card inline-edit pattern, not a full form page.
 */
export function GRNDetail({ grnId, onOpenPurchaseOrder }: { grnId: string; onOpenPurchaseOrder?: (purchaseOrderId: string) => void }) {
  const router = useRouter();
  const { session } = useSession();
  const { status, error, grn, lineItems, refetch } = useGRN(grnId);
  const { submit: updateGRN, status: updateStatus, error: updateError } = useUpdateGRN();
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];

  const [editing, setEditing] = useState(false);
  const [receivedAtInput, setReceivedAtInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [lineEdits, setLineEdits] = useState<LineEdit[]>([]);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-1/2" />
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (status === "error" || !grn) {
    return <ErrorState title="Could not load this GRN" description={error ?? undefined} onRetry={refetch} />;
  }

  const project = allProjects.find((p) => p.id === grn.projectId);
  const vendor = allVendors.find((v) => v.id === grn.vendorId);

  const startEdit = () => {
    setReceivedAtInput(grn.receivedAt.slice(0, 10));
    setNotesInput(grn.notes ?? "");
    setLineEdits(
      lineItems.map((l) => ({
        purchaseOrderLineItemId: l.purchaseOrderLineItemId,
        description: l.description,
        uom: l.uom,
        orderedQuantity: l.orderedQuantity,
        receivedQuantity: String(l.receivedQuantity),
        brand: l.brand ?? "",
        warrantyCertificateNumber: l.warrantyCertificateNumber ?? "",
      })),
    );
    setEditing(true);
  };

  const updateLineEdit = (id: string, patch: Partial<LineEdit>) => {
    setLineEdits((prev) => prev.map((l) => (l.purchaseOrderLineItemId === id ? { ...l, ...patch } : l)));
  };

  const saveEdit = async () => {
    if (!session) return;
    const parsedLines = lineEdits.map((l) => ({
      purchaseOrderLineItemId: l.purchaseOrderLineItemId,
      receivedQuantity: Number(l.receivedQuantity),
      brand: l.brand || undefined,
      warrantyCertificateNumber: l.warrantyCertificateNumber || undefined,
    }));
    if (parsedLines.some((l) => Number.isNaN(l.receivedQuantity) || l.receivedQuantity < 0)) return;
    const result = await updateGRN(
      grn.id,
      { receivedAt: new Date(receivedAtInput).toISOString(), notes: notesInput || undefined, lines: parsedLines },
      { id: session.user.id, name: session.user.name },
    );
    if (result) {
      setEditing(false);
      refetch();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{grn.grnNumber}</p>
          <h2 className="font-heading text-xl font-semibold text-ink">{project?.name ?? "GRN"}</h2>
          <p className="text-sm text-ink-muted">
            {vendor?.tradeName ?? "Unknown vendor"} · Recorded by {grn.receivedByName}
            {onOpenPurchaseOrder && (
              <>
                {" · "}
                <button type="button" className="text-brand-red underline-offset-2 hover:underline" onClick={() => onOpenPurchaseOrder(grn.purchaseOrderId)}>
                  View source Purchase Order
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission="mrc:issue">
            <Button variant="outline" size="sm" onClick={() => router.push(`${ADMIN_ROUTES.mrc}/new`)}>
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden />
              Record MRC
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="finance:write">
            <Button variant="outline" size="sm" onClick={() => router.push(ADMIN_ROUTES.gstr)}>
              <FileBarChart className="h-3.5 w-3.5" aria-hidden />
              Record GSTR Entry
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="grn:create">
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </Button>
            )}
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-ink-muted">Date Received</p>
              {!editing ? (
                <p className="text-sm text-ink">{formatDate(grn.receivedAt)}</p>
              ) : (
                <Input type="date" className="mt-1" value={receivedAtInput} onChange={(e) => setReceivedAtInput(e.target.value)} />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Notes</p>
            {!editing ? (
              <p className="whitespace-pre-wrap text-sm text-ink">{grn.notes || "No notes recorded."}</p>
            ) : (
              <Textarea rows={3} className="mt-1" value={notesInput} onChange={(e) => setNotesInput(e.target.value)} />
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Line Items</h3>
        {!editing ? (
          <GRNLineItemsTable lineItems={lineItems} />
        ) : (
          <div className="flex flex-col gap-3">
            {lineEdits.map((line) => (
              <div key={line.purchaseOrderLineItemId} className="rounded-card border border-border p-3">
                <p className="mb-2 text-sm font-medium text-ink">
                  {line.description}{" "}
                  <span className="text-xs font-normal text-ink-muted">
                    — ordered {line.orderedQuantity.toLocaleString("en-IN")} {line.uom}
                  </span>
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor={`grn-edit-qty-${line.purchaseOrderLineItemId}`}>Received Quantity</Label>
                    <Input
                      id={`grn-edit-qty-${line.purchaseOrderLineItemId}`}
                      type="number"
                      step="any"
                      className="mt-1.5"
                      value={line.receivedQuantity}
                      onChange={(e) => updateLineEdit(line.purchaseOrderLineItemId, { receivedQuantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`grn-edit-brand-${line.purchaseOrderLineItemId}`}>Brand</Label>
                    <Input
                      id={`grn-edit-brand-${line.purchaseOrderLineItemId}`}
                      className="mt-1.5"
                      value={line.brand}
                      onChange={(e) => updateLineEdit(line.purchaseOrderLineItemId, { brand: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`grn-edit-warranty-${line.purchaseOrderLineItemId}`}>Warranty Certificate</Label>
                    <Input
                      id={`grn-edit-warranty-${line.purchaseOrderLineItemId}`}
                      className="mt-1.5"
                      value={line.warrantyCertificateNumber}
                      onChange={(e) => updateLineEdit(line.purchaseOrderLineItemId, { warrantyCertificateNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="flex justify-end gap-2">
          {updateError && <p className="self-center text-xs text-error">{updateError}</p>}
          <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={updateStatus === "loading"}>
            Cancel
          </Button>
          <Button size="sm" onClick={saveEdit} disabled={updateStatus === "loading"}>
            Save Changes
          </Button>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-ink-muted">Recorded</dt>
          <dd className="text-ink">{formatDateTime(grn.createdAt)}</dd>
        </div>
        {grn.updatedAt !== grn.createdAt && (
          <div>
            <dt className="text-xs text-ink-muted">Last Updated</dt>
            <dd className="text-ink">{formatDateTime(grn.updatedAt)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

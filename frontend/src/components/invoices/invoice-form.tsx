"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/use-invoices";
import { usePurchaseOrders } from "@/hooks/use-purchase-orders";
import { useVendors } from "@/hooks/use-vendors";
import { useProjects } from "@/hooks/use-projects";
import type { Invoice } from "@/types/domain/invoice";

const invoiceFormSchema = z.object({
  purchaseOrderId: z.string().min(1, "Select a Purchase Order"),
  invoiceNumber: z.string().min(1, "Add an invoice number"),
  invoiceDate: z.string().min(1, "Add an invoice date"),
  invoiceAmount: z.coerce.number().positive("Invoice amount must be greater than 0"),
  notes: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

/**
 * Create/edit form for the Invoices tab, embedded in a Dialog.
 * `purchaseOrderId` is only editable in `"create"` mode, matching
 * `ACEForm`'s `projectId`-immutable-after-creation convention — the PO
 * picker only offers `status: "issued"` orders, matching `GRN`'s rule
 * against the same field (Part 11).
 *
 * The invoice-copy file input is metadata-only — no real bytes are ever
 * stored, the same scaled-down treatment `DocumentUploadForm` gives file
 * metadata (Part 6); see `invoice.ts`'s header comment.
 */
export function InvoiceForm({
  mode,
  invoice,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  invoice?: Invoice;
  onCancel: () => void;
  onSuccess: (invoice: Invoice) => void;
}) {
  const { session } = useSession();
  const { submit: createInvoice, status: createStatus, error: createError } = useCreateInvoice();
  const { submit: updateInvoice, status: updateStatus, error: updateError } = useUpdateInvoice();
  const { result: poResult } = usePurchaseOrders({ status: "issued", pageSize: 200 });
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const { projects: allProjects } = useProjects();
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      purchaseOrderId: invoice?.purchaseOrderId ?? "",
      invoiceNumber: invoice?.invoiceNumber ?? "",
      invoiceDate: invoice?.invoiceDate ?? "",
      invoiceAmount: invoice?.invoiceAmount ?? 0,
      notes: invoice?.notes ?? "",
    },
  });

  const onSubmit = async (values: InvoiceFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };

    if (mode === "create") {
      const created = await createInvoice(
        {
          purchaseOrderId: values.purchaseOrderId,
          invoiceNumber: values.invoiceNumber,
          invoiceDate: values.invoiceDate,
          invoiceAmount: values.invoiceAmount,
          invoiceCopyFileName: file?.name ?? invoice?.invoiceCopyFileName,
          invoiceCopyFileSizeBytes: file?.size ?? invoice?.invoiceCopyFileSizeBytes,
          notes: values.notes,
        },
        actor,
      );
      if (created) onSuccess(created);
      return;
    }

    if (!invoice) return;
    const updated = await updateInvoice(
      invoice.id,
      {
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate,
        invoiceAmount: values.invoiceAmount,
        invoiceCopyFileName: file?.name ?? invoice.invoiceCopyFileName,
        invoiceCopyFileSizeBytes: file?.size ?? invoice.invoiceCopyFileSizeBytes,
        notes: values.notes,
      },
      actor,
    );
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Purchase Order" htmlFor="invoice-po" required error={errors.purchaseOrderId?.message} hint={mode === "edit" ? "Can't be changed after creation." : "Only issued Purchase Orders can be invoiced."}>
        <Select id="invoice-po" disabled={mode === "edit"} invalid={!!errors.purchaseOrderId} {...register("purchaseOrderId")}>
          <option value="">Select an issued Purchase Order…</option>
          {(poResult?.items ?? []).map((po) => {
            const vendor = allVendors.find((v) => v.id === po.vendorId);
            const project = allProjects.find((p) => p.id === po.projectId);
            return (
              <option key={po.id} value={po.id}>
                {po.poNumber} — {vendor?.tradeName ?? "Unknown vendor"} ({project?.name ?? "Unknown project"})
              </option>
            );
          })}
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Invoice Number" htmlFor="invoice-number" required error={errors.invoiceNumber?.message}>
          <Input id="invoice-number" invalid={!!errors.invoiceNumber} {...register("invoiceNumber")} />
        </FormField>
        <FormField label="Invoice Date" htmlFor="invoice-date" required error={errors.invoiceDate?.message}>
          <Input id="invoice-date" type="date" invalid={!!errors.invoiceDate} {...register("invoiceDate")} />
        </FormField>
      </div>

      <FormField label="Invoice Amount (₹)" htmlFor="invoice-amount" required error={errors.invoiceAmount?.message}>
        <Input id="invoice-amount" type="number" step="any" invalid={!!errors.invoiceAmount} {...register("invoiceAmount")} />
      </FormField>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invoice-copy">Invoice Copy (optional)</Label>
        <label
          htmlFor="invoice-copy"
          className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-ink-muted hover:border-brand-red"
        >
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          {file?.name ?? invoice?.invoiceCopyFileName ?? "Choose a file…"}
        </label>
        <input id="invoice-copy" type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <p className="text-xs text-ink-muted">Metadata only in this demo — no file bytes are stored.</p>
      </div>

      <FormField label="Notes (optional)" htmlFor="invoice-notes">
        <Textarea id="invoice-notes" {...register("notes")} />
      </FormField>

      {submitError && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {submitError}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {mode === "create" ? "Add Invoice" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

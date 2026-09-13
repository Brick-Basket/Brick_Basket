"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreatePayment, useUpdatePayment } from "@/hooks/use-payments";
import { useInvoices } from "@/hooks/use-invoices";
import { useContracts } from "@/hooks/use-contracts";
import { PAYMENT_DIRECTION_CONFIG, PAYMENT_MODE_CONFIG, PAYMENT_MODE_ORDER } from "@/components/payments/payment-config";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { formatINR } from "@/lib/utils/format";
import type { Payment } from "@/types/domain/payment";

const paymentFormSchema = z
  .object({
    direction: z.enum(["payment", "receipt"]),
    projectId: z.string().min(1, "Select a project"),
    invoiceId: z.string().optional(),
    contractId: z.string().optional(),
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    paymentDate: z.string().min(1, "Add a date"),
    mode: z.enum(["bank_transfer", "cheque", "cash", "upi", "other"]),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.direction === "payment" && !val.invoiceId) {
      ctx.addIssue({ code: "custom", path: ["invoiceId"], message: "Select an invoice" });
    }
    if (val.direction === "receipt" && !val.contractId) {
      ctx.addIssue({ code: "custom", path: ["contractId"], message: "Select a contract" });
    }
  });

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

/**
 * Create/edit form for the Payments & Receipts tab, embedded in a
 * Dialog. `direction` and its linked reference (`invoiceId`/`contractId`)
 * plus `projectId` are only editable in `"create"` mode — together they
 * identify what this record is a payment/receipt *against*, matching
 * `CostEntry`'s identity-fields-immutable convention (Part 15).
 */
export function PaymentForm({
  mode: formMode,
  payment,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  payment?: Payment;
  onCancel: () => void;
  onSuccess: (payment: Payment) => void;
}) {
  const { session } = useSession();
  const { submit: createPayment, status: createStatus, error: createError } = useCreatePayment();
  const { submit: updatePayment, status: updateStatus, error: updateError } = useUpdatePayment();
  const { result: invoiceResult } = useInvoices({ pageSize: 200 });
  const { result: contractResult } = useContracts({ status: "accepted", pageSize: 200 });
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      direction: payment?.direction ?? "payment",
      projectId: payment?.projectId ?? "",
      invoiceId: payment?.invoiceId ?? "",
      contractId: payment?.contractId ?? "",
      amount: payment?.amount ?? 0,
      paymentDate: payment?.paymentDate ?? "",
      mode: payment?.mode ?? "bank_transfer",
      referenceNumber: payment?.referenceNumber ?? "",
      notes: payment?.notes ?? "",
    },
  });

  const direction = useWatch({ control, name: "direction" });

  const onSubmit = async (values: PaymentFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };

    if (formMode === "create") {
      const created = await createPayment(
        {
          direction: values.direction,
          projectId: values.projectId,
          invoiceId: values.direction === "payment" ? values.invoiceId : undefined,
          contractId: values.direction === "receipt" ? values.contractId : undefined,
          amount: values.amount,
          paymentDate: values.paymentDate,
          mode: values.mode,
          referenceNumber: values.referenceNumber,
          notes: values.notes,
        },
        actor,
      );
      if (created) onSuccess(created);
      return;
    }

    if (!payment) return;
    const updated = await updatePayment(
      payment.id,
      { amount: values.amount, paymentDate: values.paymentDate, mode: values.mode, referenceNumber: values.referenceNumber, notes: values.notes },
      actor,
    );
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = formMode === "create" ? createError : updateError;
  const locked = formMode === "edit";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Direction" htmlFor="payment-direction" required hint={locked ? "Can't be changed after creation." : undefined}>
          <Select id="payment-direction" disabled={locked} {...register("direction")}>
            <option value="payment">{PAYMENT_DIRECTION_CONFIG.payment.label}</option>
            <option value="receipt">{PAYMENT_DIRECTION_CONFIG.receipt.label}</option>
          </Select>
        </FormField>
        <FormField label="Project" htmlFor="payment-project" required error={errors.projectId?.message} hint={locked ? "Can't be changed after creation." : undefined}>
          <Select id="payment-project" disabled={locked} invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {direction === "payment" ? (
        <FormField label="Invoice" htmlFor="payment-invoice" required error={errors.invoiceId?.message} hint={locked ? "Can't be changed after creation." : undefined}>
          <Select id="payment-invoice" disabled={locked} invalid={!!errors.invoiceId} {...register("invoiceId")}>
            <option value="">Select an invoice…</option>
            {(invoiceResult?.items ?? []).map((inv) => {
              const vendor = allVendors.find((v) => v.id === inv.vendorId);
              return (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {vendor?.tradeName ?? "Unknown vendor"} ({formatINR(inv.invoiceAmount)})
                </option>
              );
            })}
          </Select>
        </FormField>
      ) : (
        <FormField label="Contract" htmlFor="payment-contract" required error={errors.contractId?.message} hint={locked ? "Can't be changed after creation." : "Only accepted contracts can receive a receipt."}>
          <Select id="payment-contract" disabled={locked} invalid={!!errors.contractId} {...register("contractId")}>
            <option value="">Select a contract…</option>
            {(contractResult?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.contractNumber} — {c.title}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Amount (₹)" htmlFor="payment-amount" required error={errors.amount?.message}>
          <Input id="payment-amount" type="number" step="any" invalid={!!errors.amount} {...register("amount")} />
        </FormField>
        <FormField label="Date" htmlFor="payment-date" required error={errors.paymentDate?.message}>
          <Input id="payment-date" type="date" invalid={!!errors.paymentDate} {...register("paymentDate")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Mode" htmlFor="payment-mode" required>
          <Select id="payment-mode" {...register("mode")}>
            {PAYMENT_MODE_ORDER.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_MODE_CONFIG[m].label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Reference Number (optional)" htmlFor="payment-reference" hint="Cheque no., UTR, transaction id, etc.">
          <Input id="payment-reference" {...register("referenceNumber")} />
        </FormField>
      </div>

      <FormField label="Notes (optional)" htmlFor="payment-notes">
        <Textarea id="payment-notes" {...register("notes")} />
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
          {formMode === "create" ? "Add Entry" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

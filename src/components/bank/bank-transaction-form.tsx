"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateBankTransaction, useUpdateBankTransaction } from "@/hooks/use-bank-transactions";
import { usePayments } from "@/hooks/use-payments";
import { useProjects } from "@/hooks/use-projects";
import { formatINR } from "@/lib/utils/format";
import type { BankTransaction } from "@/types/domain/bank-transaction";

const bankFormSchema = z.object({
  paymentId: z.string().optional(),
  partyOrVendorCode: z.string().min(1, "Add a party/vendor code"),
  paymentAmount: z.coerce.number().nonnegative("Amount can't be negative"),
  invoiceNumber: z.string().min(1, "Add an invoice number"),
  accountNumber: z.string().optional(),
  utrNumber: z.string().optional(),
  projectId: z.string().min(1, "Select a project"),
  yearOfExecution: z.coerce.number().int().min(2000, "Add a valid year"),
  state: z.string().min(1, "Add a state"),
  city: z.string().min(1, "Add a city"),
  taxAmount: z.coerce.number().nonnegative("Tax amount can't be negative"),
  tdsDetails: z.string().optional(),
  gstin: z.string().optional(),
  taxComponent: z.string().optional(),
  itcApplicable: z.boolean(),
  notes: z.string().optional(),
});

type BankFormValues = z.infer<typeof bankFormSchema>;

/**
 * Create/edit form for `/admin/finance/bank-cash`, embedded in a Dialog —
 * transcribes the owner's §8C field list directly (see
 * `bank-transaction.ts`'s per-field notes). Every field stays editable in
 * both modes: unlike every other module's form in this app, there's no
 * confirmed "identity" pairing to lock after creation here.
 */
export function BankTransactionForm({
  mode,
  transaction,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  transaction?: BankTransaction;
  onCancel: () => void;
  onSuccess: (transaction: BankTransaction) => void;
}) {
  const { session } = useSession();
  const { submit: createTransaction, status: createStatus, error: createError } = useCreateBankTransaction();
  const { submit: updateTransaction, status: updateStatus, error: updateError } = useUpdateBankTransaction();
  const { result: paymentResult } = usePayments({ pageSize: 200 });
  const { projects: allProjects } = useProjects();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      paymentId: transaction?.paymentId ?? "",
      partyOrVendorCode: transaction?.partyOrVendorCode ?? "",
      paymentAmount: transaction?.paymentAmount ?? 0,
      invoiceNumber: transaction?.invoiceNumber ?? "",
      accountNumber: transaction?.accountNumber ?? "",
      utrNumber: transaction?.utrNumber ?? "",
      projectId: transaction?.projectId ?? "",
      yearOfExecution: transaction?.yearOfExecution ?? new Date().getFullYear(),
      state: transaction?.state ?? "",
      city: transaction?.city ?? "",
      taxAmount: transaction?.taxAmount ?? 0,
      tdsDetails: transaction?.tdsDetails ?? "",
      gstin: transaction?.gstin ?? "",
      taxComponent: transaction?.taxComponent ?? "",
      itcApplicable: transaction?.itcApplicable ?? false,
      notes: transaction?.notes ?? "",
    },
  });

  const onSubmit = async (values: BankFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const input = {
      paymentId: values.paymentId || undefined,
      partyOrVendorCode: values.partyOrVendorCode,
      paymentAmount: values.paymentAmount,
      invoiceNumber: values.invoiceNumber,
      accountNumber: values.accountNumber || undefined,
      utrNumber: values.utrNumber || undefined,
      projectId: values.projectId,
      yearOfExecution: values.yearOfExecution,
      state: values.state,
      city: values.city,
      taxAmount: values.taxAmount,
      tdsDetails: values.tdsDetails || undefined,
      gstin: values.gstin || undefined,
      taxComponent: values.taxComponent || undefined,
      itcApplicable: values.itcApplicable,
      notes: values.notes || undefined,
    };

    if (mode === "create") {
      const created = await createTransaction(input, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!transaction) return;
    const updated = await updateTransaction(transaction.id, input, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Linked Payment (optional)" htmlFor="bank-payment" hint="Only when this entry corresponds to a modeled Payment.">
        <Select id="bank-payment" {...register("paymentId")}>
          <option value="">No linked Payment</option>
          {(paymentResult?.items ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.direction === "payment" ? "Payment" : "Receipt"} — {formatINR(p.amount)} ({p.paymentDate})
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Party/Vendor Code" htmlFor="bank-party" required error={errors.partyOrVendorCode?.message}>
          <Input id="bank-party" invalid={!!errors.partyOrVendorCode} {...register("partyOrVendorCode")} />
        </FormField>
        <FormField label="Payment Amount (₹)" htmlFor="bank-amount" required error={errors.paymentAmount?.message}>
          <Input id="bank-amount" type="number" step="any" invalid={!!errors.paymentAmount} {...register("paymentAmount")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Invoice Number" htmlFor="bank-invoice-number" required error={errors.invoiceNumber?.message}>
          <Input id="bank-invoice-number" invalid={!!errors.invoiceNumber} {...register("invoiceNumber")} />
        </FormField>
        <FormField label="Account Number (optional)" htmlFor="bank-account">
          <Input id="bank-account" {...register("accountNumber")} />
        </FormField>
      </div>

      <FormField label="UTR Number (optional)" htmlFor="bank-utr">
        <Input id="bank-utr" {...register("utrNumber")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="bank-project" required error={errors.projectId?.message}>
          <Select id="bank-project" invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Year of Execution" htmlFor="bank-year" required error={errors.yearOfExecution?.message}>
          <Input id="bank-year" type="number" invalid={!!errors.yearOfExecution} {...register("yearOfExecution")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="State" htmlFor="bank-state" required error={errors.state?.message}>
          <Input id="bank-state" invalid={!!errors.state} {...register("state")} />
        </FormField>
        <FormField label="City" htmlFor="bank-city" required error={errors.city?.message}>
          <Input id="bank-city" invalid={!!errors.city} {...register("city")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tax Amount (₹)" htmlFor="bank-tax-amount" required error={errors.taxAmount?.message}>
          <Input id="bank-tax-amount" type="number" step="any" invalid={!!errors.taxAmount} {...register("taxAmount")} />
        </FormField>
        <FormField label="GSTIN (optional)" htmlFor="bank-gstin">
          <Input id="bank-gstin" {...register("gstin")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="TDS Details (optional)" htmlFor="bank-tds" hint="E.g. TDS @2% under Section 194C.">
          <Input id="bank-tds" {...register("tdsDetails")} />
        </FormField>
        <FormField label="Tax Component (optional)" htmlFor="bank-tax-component" hint="E.g. CGST 9% + SGST 9%.">
          <Input id="bank-tax-component" {...register("taxComponent")} />
        </FormField>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="bank-itc" {...register("itcApplicable")} />
        <Label htmlFor="bank-itc">ITC applicable</Label>
      </div>

      <FormField label="Notes (optional)" htmlFor="bank-notes">
        <Textarea id="bank-notes" {...register("notes")} />
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
          {mode === "create" ? "Add Entry" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

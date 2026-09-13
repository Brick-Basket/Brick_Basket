"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateTaxRecord, useUpdateTaxRecord } from "@/hooks/use-tax-records";
import { TAX_RECORD_TYPE_CONFIG } from "@/components/finance/tax-record-config";
import { useProjects } from "@/hooks/use-projects";
import type { TaxRecord } from "@/types/domain/tax-record";

const taxFormSchema = z.object({
  type: z.enum(["tax", "statutory_license_fee"]),
  name: z.string().min(1, "Add a name"),
  authority: z.string().min(1, "Add the authority this is owed to"),
  projectId: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  dueDate: z.string().min(1, "Add a due date"),
  paidDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

type TaxFormValues = z.infer<typeof taxFormSchema>;

/**
 * Create/edit form for `/admin/finance/taxes`, embedded in a Dialog. Every
 * field stays editable in both modes — like `BankTransactionForm` (Part
 * 16), there is no owner-confirmed identity pairing here to lock.
 */
export function TaxRecordForm({
  mode,
  record,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  record?: TaxRecord;
  onCancel: () => void;
  onSuccess: (record: TaxRecord) => void;
}) {
  const { session } = useSession();
  const { submit: createRecord, status: createStatus, error: createError } = useCreateTaxRecord();
  const { submit: updateRecord, status: updateStatus, error: updateError } = useUpdateTaxRecord();
  const { projects: allProjects } = useProjects();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaxFormValues>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      type: record?.type ?? "tax",
      name: record?.name ?? "",
      authority: record?.authority ?? "",
      projectId: record?.projectId ?? "",
      amount: record?.amount ?? 0,
      dueDate: record?.dueDate ?? "",
      paidDate: record?.paidDate ?? "",
      referenceNumber: record?.referenceNumber ?? "",
      notes: record?.notes ?? "",
    },
  });

  const onSubmit = async (values: TaxFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const input = {
      type: values.type,
      name: values.name,
      authority: values.authority,
      projectId: values.projectId || undefined,
      amount: values.amount,
      dueDate: values.dueDate,
      paidDate: values.paidDate || null,
      referenceNumber: values.referenceNumber || undefined,
      notes: values.notes || undefined,
    };

    if (mode === "create") {
      const created = await createRecord(input, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!record) return;
    const updated = await updateRecord(record.id, input, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type" htmlFor="tax-type" required>
          <Select id="tax-type" {...register("type")}>
            {Object.entries(TAX_RECORD_TYPE_CONFIG).map(([value, cfg]) => (
              <option key={value} value={value}>
                {cfg.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Project (optional)" htmlFor="tax-project" hint="Leave unset for an organization-wide obligation.">
          <Select id="tax-project" {...register("projectId")}>
            <option value="">Organization-wide</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Name" htmlFor="tax-name" required error={errors.name?.message} hint="E.g. “GST — July 2026” or “Labour License Renewal”.">
        <Input id="tax-name" invalid={!!errors.name} {...register("name")} />
      </FormField>

      <FormField label="Authority" htmlFor="tax-authority" required error={errors.authority?.message} hint="The government body/department this is owed to.">
        <Input id="tax-authority" invalid={!!errors.authority} {...register("authority")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Amount (₹)" htmlFor="tax-amount" required error={errors.amount?.message}>
          <Input id="tax-amount" type="number" step="any" invalid={!!errors.amount} {...register("amount")} />
        </FormField>
        <FormField label="Due Date" htmlFor="tax-due-date" required error={errors.dueDate?.message}>
          <Input id="tax-due-date" type="date" invalid={!!errors.dueDate} {...register("dueDate")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Paid Date (optional)" htmlFor="tax-paid-date" hint="Leave blank while unpaid.">
          <Input id="tax-paid-date" type="date" {...register("paidDate")} />
        </FormField>
        <FormField label="Reference Number (optional)" htmlFor="tax-reference" hint="Receipt/challan number, once paid.">
          <Input id="tax-reference" {...register("referenceNumber")} />
        </FormField>
      </div>

      <FormField label="Notes (optional)" htmlFor="tax-notes">
        <Textarea id="tax-notes" {...register("notes")} />
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
          {mode === "create" ? "Add Record" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

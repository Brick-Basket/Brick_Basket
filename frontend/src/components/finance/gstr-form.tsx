"use client";

import { useMemo } from "react";
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
import { useCreateGSTRRecord, useUpdateGSTRRecord } from "@/hooks/use-gstr";
import { useGRNs } from "@/hooks/use-grn";
import { useContracts } from "@/hooks/use-contracts";
import { useVendors } from "@/hooks/use-vendors";
import { useProjects } from "@/hooks/use-projects";
import type { GSTRRecord, GSTRRecordType } from "@/types/domain/gstr-record";

/** Sentinel `contractLink` value meaning "no contract — describe the sale manually" (the "materials, if any" case). */
const MANUAL_SALE = "__manual__";

function buildSchema(type: GSTRRecordType) {
  return z
    .object({
      grnId: z.string().optional(),
      contractLink: z.string().optional(),
      saleDescription: z.string().optional(),
      projectId: z.string().optional(),
      period: z.string().min(1, "Add a period, e.g. 2026-09"),
      gstin: z.string().optional(),
      taxableValue: z.coerce.number().nonnegative("Taxable value can't be negative"),
      taxAmount: z.coerce.number().nonnegative("Tax amount can't be negative"),
      invoiceReference: z.string().optional(),
      notes: z.string().optional(),
    })
    .superRefine((val, ctx) => {
      if (type === "purchase" && !val.grnId) {
        ctx.addIssue({ code: "custom", path: ["grnId"], message: "Select the GRN this purchase was received against" });
      }
      if (type === "sales") {
        if (!val.contractLink) {
          ctx.addIssue({ code: "custom", path: ["contractLink"], message: "Link an accepted contract, or describe the sale manually" });
        } else if (val.contractLink === MANUAL_SALE && !val.saleDescription?.trim()) {
          ctx.addIssue({ code: "custom", path: ["saleDescription"], message: "Describe the sale" });
        }
      }
    });
}

type GSTRFormValues = z.infer<ReturnType<typeof buildSchema>>;

/**
 * Create/edit form for the `/admin/finance/gstr` Purchase/Sales tabs,
 * embedded in a Dialog. `type` is a **locked prop**, set by which tab's
 * "Add" button opened the dialog — not a switchable field like
 * `PaymentForm`'s `direction` — because the tab itself already commits
 * the entry to a category.
 *
 * The record's identity fields (`grnId` for purchase; `contractLink`/
 * `saleDescription`/`projectId` for sales) are only editable in
 * `"create"` mode, matching `GSTRRecord`'s immutable-after-creation
 * fields (see `types/domain/gstr-record.ts`).
 */
export function GSTRForm({
  type,
  mode: formMode,
  record,
  onCancel,
  onSuccess,
}: {
  type: GSTRRecordType;
  mode: "create" | "edit";
  record?: GSTRRecord;
  onCancel: () => void;
  onSuccess: (record: GSTRRecord) => void;
}) {
  const { session } = useSession();
  const { submit: createRecord, status: createStatus, error: createError } = useCreateGSTRRecord();
  const { submit: updateRecord, status: updateStatus, error: updateError } = useUpdateGSTRRecord();
  const { result: grnResult } = useGRNs({ pageSize: 200 });
  const { result: contractResult } = useContracts({ status: "accepted", pageSize: 200 });
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];
  const { projects: allProjects } = useProjects();

  const schema = useMemo(() => buildSchema(type), [type]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<GSTRFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      grnId: record?.grnId ?? "",
      contractLink: record?.contractId ?? (record?.saleDescription ? MANUAL_SALE : ""),
      saleDescription: record?.saleDescription ?? "",
      projectId: record?.projectId ?? "",
      period: record?.period ?? "",
      gstin: record?.gstin ?? "",
      taxableValue: record?.taxableValue ?? 0,
      taxAmount: record?.taxAmount ?? 0,
      invoiceReference: record?.invoiceReference ?? "",
      notes: record?.notes ?? "",
    },
  });

  const contractLink = useWatch({ control, name: "contractLink" });
  const locked = formMode === "edit";

  const onSubmit = async (values: GSTRFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };

    if (formMode === "create") {
      const created = await createRecord(
        type === "purchase"
          ? {
              type: "purchase",
              period: values.period,
              grnId: values.grnId,
              gstin: values.gstin,
              taxableValue: values.taxableValue,
              taxAmount: values.taxAmount,
              invoiceReference: values.invoiceReference,
              notes: values.notes,
            }
          : {
              type: "sales",
              period: values.period,
              projectId: values.contractLink === MANUAL_SALE ? values.projectId || undefined : undefined,
              contractId: values.contractLink === MANUAL_SALE ? undefined : values.contractLink,
              saleDescription: values.contractLink === MANUAL_SALE ? values.saleDescription : undefined,
              gstin: values.gstin,
              taxableValue: values.taxableValue,
              taxAmount: values.taxAmount,
              invoiceReference: values.invoiceReference,
              notes: values.notes,
            },
        actor,
      );
      if (created) onSuccess(created);
      return;
    }

    if (!record) return;
    const updated = await updateRecord(
      record.id,
      {
        period: values.period,
        gstin: values.gstin,
        taxableValue: values.taxableValue,
        taxAmount: values.taxAmount,
        invoiceReference: values.invoiceReference,
        notes: values.notes,
      },
      actor,
    );
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = formMode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      {type === "purchase" ? (
        <FormField
          label="GRN"
          htmlFor="gstr-grn"
          required
          error={errors.grnId?.message}
          hint={locked ? "Can't be changed after creation." : "Purchases are reported after the goods have been received (GRN)."}
        >
          <Select id="gstr-grn" disabled={locked} invalid={!!errors.grnId} {...register("grnId")}>
            <option value="">Select a GRN…</option>
            {(grnResult?.items ?? []).map((g) => {
              const vendor = allVendors.find((v) => v.id === g.vendorId);
              const project = allProjects.find((p) => p.id === g.projectId);
              return (
                <option key={g.id} value={g.id}>
                  {g.grnNumber} — {vendor?.tradeName ?? "Unknown vendor"} ({project?.name ?? "Unknown project"})
                </option>
              );
            })}
          </Select>
        </FormField>
      ) : (
        <>
          <FormField
            label="Sale"
            htmlFor="gstr-contract-link"
            required
            error={errors.contractLink?.message}
            hint={locked ? "Can't be changed after creation." : "Link the accepted contract for a constructed-house sale, or describe a materials sale manually."}
          >
            <Select id="gstr-contract-link" disabled={locked} invalid={!!errors.contractLink} {...register("contractLink")}>
              <option value="">Select…</option>
              <option value={MANUAL_SALE}>No contract — describe the sale manually</option>
              {(contractResult?.items ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contractNumber} — {c.title}
                </option>
              ))}
            </Select>
          </FormField>

          {contractLink === MANUAL_SALE && (
            <>
              <FormField label="Sale Description" htmlFor="gstr-sale-description" required error={errors.saleDescription?.message}>
                <Input id="gstr-sale-description" disabled={locked} invalid={!!errors.saleDescription} placeholder="e.g. Sale of surplus TMT steel and cement bags" {...register("saleDescription")} />
              </FormField>
              <FormField label="Project (optional)" htmlFor="gstr-project" hint="Leave unset for an organization-wide sale.">
                <Select id="gstr-project" disabled={locked} {...register("projectId")}>
                  <option value="">Organization-wide</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          )}
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Period" htmlFor="gstr-period" required error={errors.period?.message} hint="Return period, e.g. 2026-09.">
          <Input id="gstr-period" invalid={!!errors.period} placeholder="YYYY-MM" {...register("period")} />
        </FormField>
        <FormField label="GSTIN (optional)" htmlFor="gstr-gstin">
          <Input id="gstr-gstin" {...register("gstin")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Taxable Value (₹)" htmlFor="gstr-taxable-value" required error={errors.taxableValue?.message}>
          <Input id="gstr-taxable-value" type="number" step="any" invalid={!!errors.taxableValue} {...register("taxableValue")} />
        </FormField>
        <FormField label="Tax Amount (₹)" htmlFor="gstr-tax-amount" required error={errors.taxAmount?.message}>
          <Input id="gstr-tax-amount" type="number" step="any" invalid={!!errors.taxAmount} {...register("taxAmount")} />
        </FormField>
      </div>

      <FormField label="Invoice Reference (optional)" htmlFor="gstr-invoice-reference">
        <Input id="gstr-invoice-reference" {...register("invoiceReference")} />
      </FormField>

      <FormField label="Notes (optional)" htmlFor="gstr-notes">
        <Textarea id="gstr-notes" {...register("notes")} />
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

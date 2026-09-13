"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { useCustomers } from "@/hooks/use-customers";
import { useCreateMRC, useUpdateMRC } from "@/hooks/use-mrc";
import { useProjects } from "@/hooks/use-projects";
import { MRCLineItemsEditor } from "@/components/mrc/mrc-line-items-editor";
import { mrcFormSchema, type MRCFormValues } from "@/components/mrc/mrc-form-schema";
import type { MRC, CreateMRCLineInput } from "@/types/domain/mrc";

/**
 * Create/edit form for the admin MRC module, modeled closely on
 * `ContractForm` (Part 5). `mode: "edit"` is only ever mounted for a
 * `"draft"` or `"declined"` MRC — the parent page enforces that (see
 * docs/WORKFLOWS.md's read-only rule) — so this component doesn't
 * re-check status itself.
 */
export function MRCForm({
  mode,
  mrc,
  initialLines,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  mrc?: MRC;
  /** Existing line items, only passed in `edit` mode. */
  initialLines?: CreateMRCLineInput[];
  onSuccess: (mrc: MRC) => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const { customers, status: customersStatus } = useCustomers();
  const { projects: allProjects } = useProjects();
  const { submit: createMrc, status: createStatus, error: createError } = useCreateMRC();
  const { submit: updateMrc, status: updateStatus, error: updateError } = useUpdateMRC();

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MRCFormValues>({
    resolver: zodResolver(mrcFormSchema),
    defaultValues: {
      customerId: mrc?.customerId ?? "",
      projectId: mrc?.projectId ?? "",
      notes: mrc?.notes ?? "",
      lines:
        initialLines?.map((l) =>
          l.source === "grn"
            ? { source: "grn" as const, grnLineItemId: l.grnLineItemId, quantity: l.quantity, warrantyTerms: l.warrantyTerms ?? "" }
            : {
                source: "manual" as const,
                description: l.description,
                uom: l.uom,
                quantity: l.quantity,
                make: l.make,
                warrantyTerms: l.warrantyTerms ?? "",
              },
        ) ?? [{ source: "manual" as const, description: "", uom: "", quantity: 1, make: "", warrantyTerms: "" }],
    },
  });

  const onSubmit = async (values: MRCFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const lines: CreateMRCLineInput[] = values.lines.map((l) =>
      l.source === "grn"
        ? { source: "grn", grnLineItemId: l.grnLineItemId!, quantity: l.quantity, warrantyTerms: l.warrantyTerms || undefined }
        : {
            source: "manual",
            description: l.description!,
            uom: l.uom!,
            quantity: l.quantity,
            make: l.make!,
            warrantyTerms: l.warrantyTerms || undefined,
          },
    );

    if (mode === "create") {
      const created = await createMrc(
        { customerId: values.customerId, projectId: values.projectId || undefined, notes: values.notes, lines },
        actor,
      );
      if (created) onSuccess(created);
      return;
    }

    if (!mrc) return;
    const updated = await updateMrc(mrc.id, { notes: values.notes, lines }, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Customer" htmlFor="mrc-customer" required error={errors.customerId?.message}>
          {customersStatus === "loading" ? (
            <LoadingSkeleton className="h-11 w-full" />
          ) : (
            <Select id="mrc-customer" disabled={mode === "edit"} invalid={!!errors.customerId} {...register("customerId")}>
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </Select>
          )}
        </FormField>

        <FormField label="Project (optional)" htmlFor="mrc-project" hint="Which project these materials belong to.">
          <Select id="mrc-project" disabled={mode === "edit"} {...register("projectId")}>
            <option value="">No project yet</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.location}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <MRCLineItemsEditor control={control} register={register} setValue={setValue} errors={errors} />

      <FormField label="Notes (optional)" htmlFor="mrc-notes">
        <Textarea id="mrc-notes" {...register("notes")} />
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
          {mode === "create" ? "Create Draft MRC" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

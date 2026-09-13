"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateRequisition, useUpdateRequisition } from "@/hooks/use-requisitions";
import { useProjects } from "@/hooks/use-projects";
import { MaterialRequirementEditor } from "@/components/requisitions/material-requirement-editor";
import { requisitionFormSchema, type RequisitionFormValues } from "@/components/requisitions/requisition-form-schema";
import type { MaterialRequirement, PurchaseRequisition } from "@/types/domain/requisition";

/**
 * Create/edit form for the admin Requisition module. `mode: "edit"` is
 * only ever mounted for a `"draft"` or `"rejected"` requisition — the
 * parent page enforces that (see docs/WORKFLOWS.md) — so this component
 * doesn't re-check status itself.
 */
export function RequisitionForm({
  mode,
  requisition,
  existingLines,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  requisition?: PurchaseRequisition;
  existingLines?: MaterialRequirement[];
  onSuccess: (requisition: PurchaseRequisition) => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const { submit: createRequisition, status: createStatus, error: createError } = useCreateRequisition();
  const { submit: updateRequisition, status: updateStatus, error: updateError } = useUpdateRequisition();
  const { projects } = useProjects();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionFormSchema),
    defaultValues: {
      projectId: requisition?.projectId ?? "",
      notes: requisition?.notes ?? "",
      lines:
        existingLines?.map((l) => ({
          source: l.source,
          aceItemId: l.aceItemId,
          description: l.description,
          uom: l.uom,
          quantity: l.quantity,
          brand: l.brand ?? "",
        })) ?? [{ source: "predefined", description: "", uom: "", quantity: 1, brand: "" }],
    },
  });

  const projectId = watch("projectId");

  const onSubmit = async (values: RequisitionFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const lines = values.lines.map((l) => ({
      source: l.source,
      aceItemId: l.source === "predefined" ? l.aceItemId : undefined,
      description: l.description,
      uom: l.uom,
      quantity: l.quantity,
      brand: l.brand || undefined,
    }));

    if (mode === "create") {
      const created = await createRequisition({ projectId: values.projectId, notes: values.notes, lines }, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!requisition) return;
    const updated = await updateRequisition(requisition.id, { notes: values.notes, lines }, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <FormField label="Project" htmlFor="req-project" required error={errors.projectId?.message} hint={mode === "edit" ? "Can't be changed after creation." : undefined}>
        <Select id="req-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
          <option value="">Select a project…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.location}
            </option>
          ))}
        </Select>
      </FormField>

      <MaterialRequirementEditor control={control} register={register} errors={errors} setValue={setValue} projectId={projectId} />

      <FormField label="Notes (optional)" htmlFor="req-notes">
        <Textarea id="req-notes" {...register("notes")} />
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
          {mode === "create" ? "Create Draft Requisition" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

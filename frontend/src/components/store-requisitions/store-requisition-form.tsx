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
import { useCreateStoreRequisition, useUpdateStoreRequisition } from "@/hooks/use-store-requisitions";
import { useProjects } from "@/hooks/use-projects";
import { STOCK_MATERIAL_CONFIG, STOCK_MATERIAL_ORDER } from "@/components/stock/stock-material-config";
import type { StoreRequisition } from "@/types/domain/store-requisition";

// Same conditional-required-`otherMaterialName`-when-"other" pattern fixed
// for Stock/Wastage in Phase 12 (docs/OPEN_QUESTIONS.md #41(b)) — this new
// module gets it correct from the start rather than repeating that gap.
const storeRequisitionFormSchema = z
  .object({
    projectId: z.string().min(1, "Select a project"),
    requestDate: z.string().min(1, "Select a date"),
    material: z.enum(["cement", "sand", "aggregate", "tmt_steel", "bricks", "tiles", "pipes", "electrical_cable", "paint", "sanitary_fixtures", "other"]),
    otherMaterialName: z.string().optional(),
    uom: z.string().min(1, "Add a unit"),
    requestedQuantity: z.coerce.number().positive("Must be greater than 0"),
    remarks: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.material === "other" && !val.otherMaterialName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name the material when Material is set to Other",
        path: ["otherMaterialName"],
      });
    }
  });

type StoreRequisitionFormValues = z.infer<typeof storeRequisitionFormSchema>;

/**
 * Create/edit form for Store Material Requisitions, embedded in a Dialog —
 * the same single-dialog "flat record" pattern `ACEForm`/`StockForm` use,
 * rather than a dedicated `/new`/`/[id]/edit` route set: this module's
 * workflow actions (submit/approve/reject/issue) already need a detail
 * page, and reusing one Dialog for both create and edit keeps the route
 * count down without losing anything — the same reasoning `GRNDetail`'s
 * "inline edit, no dedicated /edit route" decision used. `projectId` is
 * only editable in `"create"` mode, matching every other project-scoped
 * entity's immutable-after-creation convention.
 */
export function StoreRequisitionForm({
  mode,
  requisition,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  requisition?: StoreRequisition;
  onCancel: () => void;
  onSuccess: (requisition: StoreRequisition) => void;
}) {
  const { session } = useSession();
  const { submit: createRequisition, status: createStatus, error: createError } = useCreateStoreRequisition();
  const { submit: updateRequisition, status: updateStatus, error: updateError } = useUpdateStoreRequisition();
  const { projects } = useProjects();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StoreRequisitionFormValues>({
    resolver: zodResolver(storeRequisitionFormSchema),
    defaultValues: {
      projectId: requisition?.projectId ?? "",
      requestDate: requisition?.requestDate ?? new Date().toISOString().slice(0, 10),
      material: requisition?.material ?? "cement",
      otherMaterialName: requisition?.otherMaterialName ?? "",
      uom: requisition?.uom ?? "",
      requestedQuantity: requisition?.requestedQuantity ?? 0,
      remarks: requisition?.remarks ?? "",
    },
  });

  const material = watch("material");

  const onSubmit = async (values: StoreRequisitionFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const payload = {
      requestDate: values.requestDate,
      material: values.material,
      otherMaterialName: values.material === "other" ? values.otherMaterialName : undefined,
      uom: values.uom,
      requestedQuantity: values.requestedQuantity,
      remarks: values.remarks || undefined,
    };

    if (mode === "create") {
      const created = await createRequisition({ projectId: values.projectId, ...payload }, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!requisition) return;
    const updated = await updateRequisition(requisition.id, payload, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Project"
          htmlFor="mr-project"
          required
          error={errors.projectId?.message}
          hint={mode === "edit" ? "Can't be changed after creation." : undefined}
        >
          <Select id="mr-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Request Date" htmlFor="mr-date" required error={errors.requestDate?.message}>
          <Input id="mr-date" type="date" invalid={!!errors.requestDate} {...register("requestDate")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Material" htmlFor="mr-material" required>
          <Select id="mr-material" {...register("material")}>
            {STOCK_MATERIAL_ORDER.map((m) => (
              <option key={m} value={m}>
                {STOCK_MATERIAL_CONFIG[m].label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Unit" htmlFor="mr-uom" required error={errors.uom?.message}>
          <Input id="mr-uom" placeholder="bags, kg, cu.ft…" invalid={!!errors.uom} {...register("uom")} />
        </FormField>
      </div>

      {material === "other" && (
        <FormField label="Material Name" htmlFor="mr-other-name" error={errors.otherMaterialName?.message} hint="Only shown when Material is set to Other.">
          <Input id="mr-other-name" invalid={!!errors.otherMaterialName} {...register("otherMaterialName")} />
        </FormField>
      )}

      <FormField label="Requested Quantity" htmlFor="mr-quantity" required error={errors.requestedQuantity?.message}>
        <Input id="mr-quantity" type="number" step="any" invalid={!!errors.requestedQuantity} {...register("requestedQuantity")} />
      </FormField>

      <FormField label="Remarks (optional)" htmlFor="mr-remarks" hint="What this material is needed for.">
        <Textarea id="mr-remarks" {...register("remarks")} />
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
          {mode === "create" ? "Create Request" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

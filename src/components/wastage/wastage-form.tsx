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
import { useCreateWastageEntry, useUpdateWastageEntry } from "@/hooks/use-wastage";
import { useProjects } from "@/hooks/use-projects";
import { STOCK_MATERIAL_CONFIG, STOCK_MATERIAL_ORDER } from "@/components/stock/stock-material-config";
import type { WastageEntry } from "@/types/domain/wastage-entry";

// FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase 12):
// same `otherMaterialName`-required-when-`material === "other"` gap as
// `StockForm` (docs/OPEN_QUESTIONS.md #41(b)), fixed the same way.
const wastageFormSchema = z
  .object({
    projectId: z.string().min(1, "Select a project"),
    material: z.enum(["cement", "sand", "aggregate", "tmt_steel", "bricks", "tiles", "pipes", "electrical_cable", "paint", "sanitary_fixtures", "other"]),
    otherMaterialName: z.string().optional(),
    uom: z.string().min(1, "Add a unit"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    value: z.coerce.number().nonnegative("Can't be negative"),
    recordedAt: z.string().min(1, "Select a date"),
    reason: z.string().optional(),
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

type WastageFormValues = z.infer<typeof wastageFormSchema>;

/** Create/edit form for the Wastage module, embedded in a Dialog — same "flat record" pattern as `ACEForm`/`StockForm`. `projectId` is only editable in `"create"` mode. */
export function WastageForm({
  mode,
  entry,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  entry?: WastageEntry;
  onCancel: () => void;
  onSuccess: (entry: WastageEntry) => void;
}) {
  const { session } = useSession();
  const { submit: createEntry, status: createStatus, error: createError } = useCreateWastageEntry();
  const { submit: updateEntry, status: updateStatus, error: updateError } = useUpdateWastageEntry();
  const { projects } = useProjects();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WastageFormValues>({
    resolver: zodResolver(wastageFormSchema),
    defaultValues: {
      projectId: entry?.projectId ?? "",
      material: entry?.material ?? "cement",
      otherMaterialName: entry?.otherMaterialName ?? "",
      uom: entry?.uom ?? "",
      quantity: entry?.quantity ?? 0,
      value: entry?.value ?? 0,
      recordedAt: entry?.recordedAt.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      reason: entry?.reason ?? "",
    },
  });

  const material = watch("material");

  const onSubmit = async (values: WastageFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const payload = {
      material: values.material,
      otherMaterialName: values.material === "other" ? values.otherMaterialName : undefined,
      uom: values.uom,
      quantity: values.quantity,
      value: values.value,
      recordedAt: new Date(values.recordedAt).toISOString(),
      reason: values.reason || undefined,
    };

    if (mode === "create") {
      const created = await createEntry({ projectId: values.projectId, ...payload }, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!entry) return;
    const updated = await updateEntry(entry.id, payload, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="waste-project" required error={errors.projectId?.message} hint={mode === "edit" ? "Can't be changed after creation." : undefined}>
          <Select id="waste-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Material" htmlFor="waste-material" required>
          <Select id="waste-material" {...register("material")}>
            {STOCK_MATERIAL_ORDER.map((m) => (
              <option key={m} value={m}>
                {STOCK_MATERIAL_CONFIG[m].label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {material === "other" && (
        <FormField label="Material Name" htmlFor="waste-other-name" hint="Only shown when Material is set to Other.">
          <Input id="waste-other-name" {...register("otherMaterialName")} />
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Unit" htmlFor="waste-uom" required error={errors.uom?.message}>
          <Input id="waste-uom" placeholder="bag, kg, box…" invalid={!!errors.uom} {...register("uom")} />
        </FormField>
        <FormField label="Date Recorded" htmlFor="waste-date" required error={errors.recordedAt?.message}>
          <Input id="waste-date" type="date" invalid={!!errors.recordedAt} {...register("recordedAt")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Quantity" htmlFor="waste-quantity" required error={errors.quantity?.message}>
          <Input id="waste-quantity" type="number" step="any" invalid={!!errors.quantity} {...register("quantity")} />
        </FormField>
        <FormField label="Value (₹)" htmlFor="waste-value" required error={errors.value?.message}>
          <Input id="waste-value" type="number" step="any" invalid={!!errors.value} {...register("value")} />
        </FormField>
      </div>

      <FormField label="Reason (optional)" htmlFor="waste-reason" hint="Why this was procured above scope or otherwise unusable.">
        <Textarea id="waste-reason" {...register("reason")} />
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
          {mode === "create" ? "Log Wastage" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

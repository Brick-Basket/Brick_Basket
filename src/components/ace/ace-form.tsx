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
import { useCreateACEItem, useUpdateACEItem } from "@/hooks/use-ace";
import { useProjects } from "@/hooks/use-projects";
import { CONTRACT_CATEGORY_CONFIG, CONTRACT_CATEGORY_ORDER } from "@/components/contracts/contract-category-config";
import type { ACEItem } from "@/types/domain/ace-item";

const aceFormSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  category: z.enum(["civil", "electrical", "plumbing_sanitary", "mechanical", "finishing", "labour", "design_consultancy", "other"]),
  itemDescription: z.string().min(2, "Add an item description"),
  uom: z.string().min(1, "Add a unit"),
  rate: z.coerce.number().nonnegative("Rate can't be negative"),
  notes: z.string().optional(),
});

type ACEFormValues = z.infer<typeof aceFormSchema>;

/** Create/edit form for the ACE module, embedded in a Dialog. `projectId` is only editable in `"create"` mode — a rate sheet's project association doesn't change afterward. */
export function ACEForm({
  mode,
  item,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  item?: ACEItem;
  onCancel: () => void;
  onSuccess: (item: ACEItem) => void;
}) {
  const { session } = useSession();
  const { projects } = useProjects();
  const { submit: createItem, status: createStatus, error: createError } = useCreateACEItem();
  const { submit: updateItem, status: updateStatus, error: updateError } = useUpdateACEItem();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ACEFormValues>({
    resolver: zodResolver(aceFormSchema),
    defaultValues: {
      projectId: item?.projectId ?? "",
      category: item?.category ?? "civil",
      itemDescription: item?.itemDescription ?? "",
      uom: item?.uom ?? "",
      rate: item?.rate ?? 0,
      notes: item?.notes ?? "",
    },
  });

  const onSubmit = async (values: ACEFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };

    if (mode === "create") {
      const created = await createItem(values, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!item) return;
    const updated = await updateItem(item.id, { category: values.category, itemDescription: values.itemDescription, uom: values.uom, rate: values.rate, notes: values.notes }, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="ace-project" required error={errors.projectId?.message} hint={mode === "edit" ? "Can't be changed after creation." : undefined}>
          <Select id="ace-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Category" htmlFor="ace-category" required>
          <Select id="ace-category" {...register("category")}>
            {CONTRACT_CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CONTRACT_CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Item Description" htmlFor="ace-description" required error={errors.itemDescription?.message}>
        <Input id="ace-description" invalid={!!errors.itemDescription} {...register("itemDescription")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="UOM" htmlFor="ace-uom" required error={errors.uom?.message}>
          <Input id="ace-uom" placeholder="kg, sq.ft, each…" invalid={!!errors.uom} {...register("uom")} />
        </FormField>
        <FormField label="Rate (₹)" htmlFor="ace-rate" required error={errors.rate?.message}>
          <Input id="ace-rate" type="number" step="any" invalid={!!errors.rate} {...register("rate")} />
        </FormField>
      </div>

      <FormField label="Notes (optional)" htmlFor="ace-notes" hint="E.g. a reference brand this rate assumes.">
        <Textarea id="ace-notes" {...register("notes")} />
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
          {mode === "create" ? "Add Rate" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

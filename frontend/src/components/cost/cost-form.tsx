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
import { useCreateCostEntry, useUpdateCostEntry } from "@/hooks/use-cost";
import { CONTRACT_CATEGORY_CONFIG, CONTRACT_CATEGORY_ORDER } from "@/components/contracts/contract-category-config";
import { useProjects } from "@/hooks/use-projects";
import type { CostEntry } from "@/types/domain/cost-entry";

const costFormSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  category: z.enum(["civil", "electrical", "plumbing_sanitary", "mechanical", "finishing", "labour", "design_consultancy", "other"]),
  budgetAmount: z.coerce.number().nonnegative("Budget can't be negative"),
  actualAmount: z.coerce.number().nonnegative("Actual can't be negative"),
  notes: z.string().optional(),
});

type CostFormValues = z.infer<typeof costFormSchema>;

/**
 * Create/edit form for the Project Cost Accounting module, embedded in a
 * Dialog. `projectId` and `category` are only editable in `"create"`
 * mode — a budget/actual row's project+category identity doesn't change
 * afterward, mirroring `ACEForm`'s `projectId`-immutable-after-creation
 * convention (here extended to `category` too, since together they
 * identify the row). `actualAmount` is manually entered — **FRONTEND
 * IMPLEMENTATION DECISION**, see docs/OPEN_QUESTIONS.md #36.
 */
export function CostForm({
  mode,
  entry,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  entry?: CostEntry;
  onCancel: () => void;
  onSuccess: (entry: CostEntry) => void;
}) {
  const { session } = useSession();
  const { submit: createEntry, status: createStatus, error: createError } = useCreateCostEntry();
  const { submit: updateEntry, status: updateStatus, error: updateError } = useUpdateCostEntry();
  const { projects: allProjects } = useProjects();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CostFormValues>({
    resolver: zodResolver(costFormSchema),
    defaultValues: {
      projectId: entry?.projectId ?? "",
      category: entry?.category ?? "civil",
      budgetAmount: entry?.budgetAmount ?? 0,
      actualAmount: entry?.actualAmount ?? 0,
      notes: entry?.notes ?? "",
    },
  });

  const onSubmit = async (values: CostFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };

    if (mode === "create") {
      const created = await createEntry(values, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!entry) return;
    const updated = await updateEntry(entry.id, { budgetAmount: values.budgetAmount, actualAmount: values.actualAmount, notes: values.notes }, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="cost-project" required error={errors.projectId?.message} hint={mode === "edit" ? "Can't be changed after creation." : undefined}>
          <Select id="cost-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Category" htmlFor="cost-category" required hint={mode === "edit" ? "Can't be changed after creation." : undefined}>
          <Select id="cost-category" disabled={mode === "edit"} {...register("category")}>
            {CONTRACT_CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CONTRACT_CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Budget Amount (₹)" htmlFor="cost-budget" required error={errors.budgetAmount?.message}>
          <Input id="cost-budget" type="number" step="any" invalid={!!errors.budgetAmount} {...register("budgetAmount")} />
        </FormField>
        <FormField label="Actual Amount (₹)" htmlFor="cost-actual" required error={errors.actualAmount?.message} hint="Entered manually for now — not yet drawn from Payments & Receipts.">
          <Input id="cost-actual" type="number" step="any" invalid={!!errors.actualAmount} {...register("actualAmount")} />
        </FormField>
      </div>

      <FormField label="Notes (optional)" htmlFor="cost-notes" hint="E.g. why actual spend moved off budget.">
        <Textarea id="cost-notes" {...register("notes")} />
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

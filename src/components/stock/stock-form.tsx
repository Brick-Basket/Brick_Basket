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
import { useCreateStockEntry, useUpdateStockEntry } from "@/hooks/use-stock";
import { useProjects } from "@/hooks/use-projects";
import { STOCK_MATERIAL_CONFIG, STOCK_MATERIAL_ORDER } from "@/components/stock/stock-material-config";
import type { StockEntry } from "@/types/domain/stock-entry";

// FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase 12):
// `otherMaterialName` used to be a plain optional string with no
// conditional-required check when `material === "other"` — a real gap
// flagged in docs/OPEN_QUESTIONS.md #41(b), inconsistent with every sibling
// discriminator pattern in this app (MRC's `source`, DPR's "Other" branch,
// GSTR's `type`, Payment's `direction`), all of which enforce their
// conditional field via `.superRefine()`. Fixed here the same way.
const stockFormSchema = z
  .object({
    projectId: z.string().min(1, "Select a project"),
    material: z.enum(["cement", "sand", "aggregate", "tmt_steel", "bricks", "tiles", "pipes", "electrical_cable", "paint", "sanitary_fixtures", "other"]),
    otherMaterialName: z.string().optional(),
    uom: z.string().min(1, "Add a unit"),
    date: z.string().min(1, "Select a date"),
    openingStock: z.coerce.number().nonnegative("Can't be negative"),
    receivedToday: z.coerce.number().nonnegative("Can't be negative"),
    consumedToday: z.coerce.number().nonnegative("Can't be negative"),
    supplierName: z.string().optional(),
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

type StockFormValues = z.infer<typeof stockFormSchema>;

/** Create/edit form for the Stock Statement module, embedded in a Dialog — same "flat record" pattern as `ACEForm`. `projectId`/`material` are only editable in `"create"` mode, matching `ACEItem.projectId`'s immutable-after-creation convention. */
export function StockForm({
  mode,
  entry,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  entry?: StockEntry;
  onCancel: () => void;
  onSuccess: (entry: StockEntry) => void;
}) {
  const { session } = useSession();
  const { submit: createEntry, status: createStatus, error: createError } = useCreateStockEntry();
  const { submit: updateEntry, status: updateStatus, error: updateError } = useUpdateStockEntry();
  const { projects } = useProjects();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StockFormValues>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      projectId: entry?.projectId ?? "",
      material: entry?.material ?? "cement",
      otherMaterialName: entry?.otherMaterialName ?? "",
      uom: entry?.uom ?? "",
      date: entry?.date ?? new Date().toISOString().slice(0, 10),
      openingStock: entry?.openingStock ?? 0,
      receivedToday: entry?.receivedToday ?? 0,
      consumedToday: entry?.consumedToday ?? 0,
      supplierName: entry?.supplierName ?? "",
      remarks: entry?.remarks ?? "",
    },
  });

  const material = watch("material");

  const onSubmit = async (values: StockFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const payload = {
      otherMaterialName: values.material === "other" ? values.otherMaterialName : undefined,
      uom: values.uom,
      date: values.date,
      openingStock: values.openingStock,
      receivedToday: values.receivedToday,
      consumedToday: values.consumedToday,
      supplierName: values.supplierName || undefined,
      remarks: values.remarks || undefined,
    };

    if (mode === "create") {
      const created = await createEntry({ projectId: values.projectId, material: values.material, ...payload }, actor);
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
        <FormField label="Project" htmlFor="stock-project" required error={errors.projectId?.message} hint={mode === "edit" ? "Can't be changed after creation." : undefined}>
          <Select id="stock-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Material" htmlFor="stock-material" required hint={mode === "edit" ? "Can't be changed after creation." : undefined}>
          <Select id="stock-material" disabled={mode === "edit"} {...register("material")}>
            {STOCK_MATERIAL_ORDER.map((m) => (
              <option key={m} value={m}>
                {STOCK_MATERIAL_CONFIG[m].label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {material === "other" && (
        <FormField label="Material Name" htmlFor="stock-other-name" hint="Only shown when Material is set to Other.">
          <Input id="stock-other-name" {...register("otherMaterialName")} />
        </FormField>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Unit" htmlFor="stock-uom" required error={errors.uom?.message}>
          <Input id="stock-uom" placeholder="bag, cu.m, kg…" invalid={!!errors.uom} {...register("uom")} />
        </FormField>
        <FormField label="Date" htmlFor="stock-date" required error={errors.date?.message}>
          <Input id="stock-date" type="date" invalid={!!errors.date} {...register("date")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Opening Stock" htmlFor="stock-opening" required error={errors.openingStock?.message}>
          <Input id="stock-opening" type="number" step="any" invalid={!!errors.openingStock} {...register("openingStock")} />
        </FormField>
        <FormField label="Received Today" htmlFor="stock-received" required error={errors.receivedToday?.message}>
          <Input id="stock-received" type="number" step="any" invalid={!!errors.receivedToday} {...register("receivedToday")} />
        </FormField>
        <FormField label="Consumed Today" htmlFor="stock-consumed" required error={errors.consumedToday?.message}>
          <Input id="stock-consumed" type="number" step="any" invalid={!!errors.consumedToday} {...register("consumedToday")} />
        </FormField>
      </div>

      <FormField label="Supplier (optional)" htmlFor="stock-supplier">
        <Input id="stock-supplier" {...register("supplierName")} />
      </FormField>

      <FormField label="Remarks (optional)" htmlFor="stock-remarks">
        <Textarea id="stock-remarks" {...register("remarks")} />
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

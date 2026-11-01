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
import { useCreateStockEntry, useStockTrace, useUpdateStockEntry } from "@/hooks/use-stock";
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
    setValue,
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
  const projectId = watch("projectId");
  const date = watch("date");
  const openingStockInput = watch("openingStock");
  const receivedTodayInput = watch("receivedToday");
  const consumedTodayInput = watch("consumedToday");

  // BUG FIX (owner report: "Use these values" against a day with no prior
  // Opening Stock recorded — e.g. a project this demo's seed data never
  // gave any earlier Stock Statement rows, like Luxury Villa — silently
  // produced a negative Closing Stock, which the table then rendered in
  // `text-warning` with no explanation anywhere of *why* it was flagged).
  // `StockEntry.closingStock` is always computed as `opening + received -
  // consumed` (see its own header comment) and this form never validated
  // that the result makes physical sense — you can't consume material
  // that was never received or carried over as opening stock. Mirroring
  // that same computation live here (rather than only after a round trip
  // to the table) surfaces the problem at the moment it's created, not
  // after the fact. This is deliberately a **warning, not a hard block**
  // (unlike GRN's `assertWithinOrdered`, which does reject outright):
  // Stock Statement is explicitly a manually entered reconciliation
  // ledger (see the "Traced from..." aid box below), and Stores staff may
  // legitimately need to record an observed shortfall — e.g. opening
  // stock itself was never logged for an earlier day — for investigation
  // rather than being blocked from saving it at all.
  const computedClosingStock = (() => {
    const opening = Number(openingStockInput);
    const received = Number(receivedTodayInput);
    const consumed = Number(consumedTodayInput);
    if (Number.isNaN(opening) || Number.isNaN(received) || Number.isNaN(consumed)) return null;
    return opening + received - consumed;
  })();
  const closingStockIsNegative = computedClosingStock !== null && computedClosingStock < 0;
  // Spec-review correction (docs/OPEN_QUESTIONS.md #32): GRN/Store
  // Requisition ("MR")/Wastage used to be unconnected to this ledger
  // entirely. This surfaces what those three modules recorded for the
  // same project/material/day as a reconciliation aid — it never
  // auto-fills or auto-submits; the person entering this row decides
  // whether to use it.
  const { trace } = useStockTrace(projectId, material, date);
  const hasTrace = !!trace && (trace.tracedReceivedToday > 0 || trace.tracedIssuedToday > 0 || trace.tracedWastedToday > 0);

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
        // UI FIX (broad audit pass): the schema's `.superRefine()` above already
        // requires this field when Material is "other", but the error/invalid
        // props were never wired to the `FormField`/`Input` here, so a blank
        // submit was silently blocked with zero visible feedback (no red text,
        // no border) — matching sibling `store-requisition-form.tsx`'s wiring.
        <FormField
          label="Material Name"
          htmlFor="stock-other-name"
          error={errors.otherMaterialName?.message}
          hint="Only shown when Material is set to Other."
        >
          <Input id="stock-other-name" invalid={!!errors.otherMaterialName} {...register("otherMaterialName")} />
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

      {closingStockIsNegative && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            This would make Closing Stock <span className="font-medium">{computedClosingStock?.toLocaleString("en-IN")}</span> — more was
            consumed than was ever received or carried over as opening stock. Double-check Opening Stock for this day before saving (it can
            still be saved as-is, e.g. to record a shortfall for investigation).
          </span>
        </div>
      )}

      {hasTrace && trace && (
        <div className="flex flex-col gap-2 rounded-card border border-border bg-surface-muted p-3 text-sm">
          <p className="font-medium text-ink">Traced from other Store Management records for this day</p>
          <p className="text-ink-muted">
            GRN receipts: <span className="font-medium text-ink">{trace.tracedReceivedToday.toLocaleString("en-IN")}</span>
            {trace.tracedReceivedLineCount > 0
              ? ` (${trace.tracedReceivedLineCount} line${trace.tracedReceivedLineCount === 1 ? "" : "s"})`
              : ""}
            {" · "}MR issuance: <span className="font-medium text-ink">{trace.tracedIssuedToday.toLocaleString("en-IN")}</span>
            {" · "}Wastage: <span className="font-medium text-ink">{trace.tracedWastedToday.toLocaleString("en-IN")}</span>
          </p>
          <p className="text-xs text-ink-muted">
            A reconciliation aid only — this Stock Statement row stays manually entered; nothing here is written in automatically.
          </p>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setValue("receivedToday", trace.tracedReceivedToday);
                setValue("consumedToday", trace.tracedIssuedToday + trace.tracedWastedToday);
              }}
            >
              Use these values
            </Button>
          </div>
        </div>
      )}

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

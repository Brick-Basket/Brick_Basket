"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateScheduleActivity, useUpdateScheduleActivity } from "@/hooks/use-schedule";
import { useProjects } from "@/hooks/use-projects";
import {
  formatMonthKey,
  getMonthKeysInRange,
  getMonthlyPlanTotal,
  validateMonthlyPlan,
} from "@/components/schedule/schedule-monthly-plan-math";
import type { ScheduleActivity, ScheduleMonthlyPlanEntry } from "@/types/domain/project-schedule";

const scheduleActivityFormSchema = z
  .object({
    projectId: z.string().min(1, "Select a project"),
    activity: z.string().min(2, "Add an activity name"),
    uom: z.string().min(1, "Add a unit"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    plannedStart: z.string().min(1, "Select a start date"),
    plannedEnd: z.string().min(1, "Select an end date"),
    notes: z.string().optional(),
  })
  .refine((v) => v.plannedEnd >= v.plannedStart, {
    message: "Planned end can't be before planned start",
    path: ["plannedEnd"],
  });

type ScheduleActivityFormValues = z.infer<typeof scheduleActivityFormSchema>;

/** Create/edit form for a schedule activity, embedded in a Dialog — same "flat record" pattern as `ACEForm`/`StockForm`. `projectId` is only editable in `"create"` mode. */
export function ScheduleActivityForm({
  mode,
  activity,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  activity?: ScheduleActivity;
  onCancel: () => void;
  onSuccess: (activity: ScheduleActivity) => void;
}) {
  const { session } = useSession();
  const { projects: allProjects } = useProjects();
  const { submit: createActivity, status: createStatus, error: createError } = useCreateScheduleActivity();
  const { submit: updateActivity, status: updateStatus, error: updateError } = useUpdateScheduleActivity();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleActivityFormValues>({
    resolver: zodResolver(scheduleActivityFormSchema),
    defaultValues: {
      projectId: activity?.projectId ?? "",
      activity: activity?.activity ?? "",
      uom: activity?.uom ?? "",
      quantity: activity?.quantity ?? 1,
      plannedStart: activity?.plannedStart ?? new Date().toISOString().slice(0, 10),
      plannedEnd: activity?.plannedEnd ?? new Date().toISOString().slice(0, 10),
      notes: activity?.notes ?? "",
    },
  });

  // Monthly planned-quantity breakdown (Phase 3) — deliberately kept outside
  // react-hook-form's own field registry rather than a `useFieldArray`,
  // since its very set of fields (one per month) changes shape every time
  // `plannedStart`/`plannedEnd` change, which `useFieldArray` isn't built
  // to reconcile automatically. `breakdownEnabled` (empty `monthlyPlan` vs.
  // not) and per-month values are local state instead, validated on submit
  // via the same `validateMonthlyPlan` the adapter itself re-checks.
  const watchedStart = watch("plannedStart");
  const watchedEnd = watch("plannedEnd");
  const watchedQuantity = watch("quantity");
  const monthKeys = getMonthKeysInRange(watchedStart, watchedEnd);

  const [breakdownEnabled, setBreakdownEnabled] = useState((activity?.monthlyPlan.length ?? 0) > 0);
  const [monthlyValues, setMonthlyValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const entry of activity?.monthlyPlan ?? []) initial[entry.month] = String(entry.plannedQuantity);
    return initial;
  });

  // Reconciles `monthlyValues` to whichever months the current date range
  // actually spans — a month dropped by a date change is discarded, a newly
  // spanned month starts blank, and every already-entered value for a month
  // that's still in range is preserved untouched.
  useEffect(() => {
    if (!breakdownEnabled) return;
    setMonthlyValues((prev) => {
      const next: Record<string, string> = {};
      for (const key of monthKeys) next[key] = prev[key] ?? "";
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKeys.join(","), breakdownEnabled]);

  const monthlyPlanEntries: ScheduleMonthlyPlanEntry[] = breakdownEnabled
    ? monthKeys.map((month) => ({ month, plannedQuantity: Number(monthlyValues[month]) || 0 }))
    : [];
  const monthlyPlanTotal = getMonthlyPlanTotal(monthlyPlanEntries);
  const monthlyPlanError = breakdownEnabled ? validateMonthlyPlan(Number(watchedQuantity) || 0, monthlyPlanEntries) : null;

  const onSubmit = async (values: ScheduleActivityFormValues) => {
    if (!session) return;
    if (monthlyPlanError) return; // inline error already shown; block submit
    const actor = { id: session.user.id, name: session.user.name };
    const payload = {
      activity: values.activity,
      uom: values.uom,
      quantity: values.quantity,
      plannedStart: values.plannedStart,
      plannedEnd: values.plannedEnd,
      monthlyPlan: monthlyPlanEntries,
      notes: values.notes || undefined,
    };

    if (mode === "create") {
      const created = await createActivity({ projectId: values.projectId, ...payload }, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!activity) return;
    const updated = await updateActivity(activity.id, payload, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField
        label="Project"
        htmlFor="schedule-project"
        required
        error={errors.projectId?.message}
        hint={mode === "edit" ? "Can't be changed after creation." : undefined}
      >
        <Select id="schedule-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
          <option value="">Select a project…</option>
          {allProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Activity" htmlFor="schedule-activity" required error={errors.activity?.message}>
        <Input id="schedule-activity" placeholder="e.g. Excavation" invalid={!!errors.activity} {...register("activity")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Unit" htmlFor="schedule-uom" required error={errors.uom?.message}>
          <Input id="schedule-uom" placeholder="cum, sq.ft, job…" invalid={!!errors.uom} {...register("uom")} />
        </FormField>
        <FormField label="Quantity" htmlFor="schedule-quantity" required error={errors.quantity?.message}>
          <Input id="schedule-quantity" type="number" step="any" invalid={!!errors.quantity} {...register("quantity")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Planned Start" htmlFor="schedule-start" required error={errors.plannedStart?.message}>
          <Input id="schedule-start" type="date" invalid={!!errors.plannedStart} {...register("plannedStart")} />
        </FormField>
        <FormField label="Planned End" htmlFor="schedule-end" required error={errors.plannedEnd?.message}>
          <Input id="schedule-end" type="date" invalid={!!errors.plannedEnd} {...register("plannedEnd")} />
        </FormField>
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <Checkbox
            checked={breakdownEnabled}
            onChange={(e) => setBreakdownEnabled(e.target.checked)}
          />
          Break down planned quantity by month
        </label>
        <p className="text-xs text-ink-muted">
          Optional. When enabled, the months below (from Planned Start to Planned End) must add up to exactly the
          total Quantity above.
        </p>

        {breakdownEnabled && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {monthKeys.map((month) => (
                <FormField key={month} label={formatMonthKey(month)} htmlFor={`schedule-month-${month}`}>
                  <Input
                    id={`schedule-month-${month}`}
                    type="number"
                    step="any"
                    min={0}
                    value={monthlyValues[month] ?? ""}
                    onChange={(e) => setMonthlyValues((prev) => ({ ...prev, [month]: e.target.value }))}
                  />
                </FormField>
              ))}
            </div>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-ink-muted">
                Total: {monthlyPlanTotal.toLocaleString("en-IN")} / {(Number(watchedQuantity) || 0).toLocaleString("en-IN")}
              </span>
            </div>
            {monthlyPlanError && (
              <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                {monthlyPlanError}
              </div>
            )}
          </>
        )}
      </div>

      <FormField label="Notes (optional)" htmlFor="schedule-notes">
        <Textarea id="schedule-notes" {...register("notes")} />
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
        <Button type="submit" disabled={submitting || !!monthlyPlanError}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {mode === "create" ? "Add Activity" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

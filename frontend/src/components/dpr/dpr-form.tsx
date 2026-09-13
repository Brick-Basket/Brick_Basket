"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateDPR, useUpdateDPR, useDPRWorkItemHistory } from "@/hooks/use-dpr";
import { DPRManpowerEditor } from "@/components/dpr/dpr-manpower-editor";
import { DPRWorkItemsEditor } from "@/components/dpr/dpr-work-items-editor";
import { DPR_MANPOWER_CATEGORIES } from "@/components/dpr/dpr-manpower-config";
import { dprFormSchema, type DPRFormValues } from "@/components/dpr/dpr-form-schema";
import { useProjects } from "@/hooks/use-projects";
import type { DPR, DPRManpowerEntry, DPRWorkItemEntry, CreateDPRManpowerInput, CreateDPRWorkItemInput } from "@/types/domain/dpr";

/**
 * Create/edit form for the admin DPR module, modeled closely on `MRCForm`
 * (Part 12) / `ContractForm` (Part 5). `projectId` is immutable after
 * creation (matches `UpdateDPRInput`'s typing), so it's disabled in `edit`
 * mode. The work-item picker/preview needs `projectId` and `reportDate`
 * live as the user types, so both are watched rather than only read at
 * submit time.
 */
export function DPRForm({
  mode,
  dpr,
  initialManpower,
  initialWorkItems,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  dpr?: DPR;
  /** Existing manpower rows, only passed in `edit` mode. */
  initialManpower?: DPRManpowerEntry[];
  /** Existing work-item lines, only passed in `edit` mode. */
  initialWorkItems?: DPRWorkItemEntry[];
  onSuccess: (dpr: DPR) => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const { submit: createDpr, status: createStatus, error: createError } = useCreateDPR();
  const { submit: updateDpr, status: updateStatus, error: updateError } = useUpdateDPR();
  const { projects: allProjects } = useProjects();

  const manpowerByCategory = new Map((initialManpower ?? []).map((m) => [m.category, m]));

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DPRFormValues>({
    resolver: zodResolver(dprFormSchema),
    defaultValues: {
      projectId: dpr?.projectId ?? "",
      reportDate: dpr?.reportDate ?? new Date().toISOString().slice(0, 10),
      notes: dpr?.notes ?? "",
      manpower: DPR_MANPOWER_CATEGORIES.map((cat) => {
        const existing = manpowerByCategory.get(cat.value);
        return {
          category: cat.value,
          skilled: existing?.skilled ?? 0,
          unskilled: existing?.unskilled ?? 0,
          agency: existing?.agency ?? "",
        };
      }),
      workItems: (initialWorkItems ?? []).map((w) => ({
        workItemMasterId: w.workItemMasterId,
        otherDescription: w.otherDescription ?? "",
        otherUom: w.otherUom ?? "",
        location: w.location ?? "",
        plannedQty: w.plannedQty,
        todayQty: w.todayQty,
        remarks: w.remarks ?? "",
        scheduleActivityId: w.scheduleActivityId ?? "",
      })),
    },
  });

  const projectId = useWatch({ control, name: "projectId" });
  const reportDate = useWatch({ control, name: "reportDate" });
  const { history } = useDPRWorkItemHistory(projectId || null);

  const onSubmit = async (values: DPRFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const manpower: CreateDPRManpowerInput[] = values.manpower.map((m) => ({
      category: m.category,
      skilled: m.skilled,
      unskilled: m.unskilled,
      agency: m.agency || undefined,
    }));
    const workItems: CreateDPRWorkItemInput[] = values.workItems.map((w) => ({
      workItemMasterId: w.workItemMasterId,
      otherDescription: w.otherDescription || undefined,
      otherUom: w.otherUom || undefined,
      location: w.location || undefined,
      plannedQty: w.plannedQty,
      todayQty: w.todayQty,
      remarks: w.remarks || undefined,
      scheduleActivityId: w.scheduleActivityId || null,
    }));

    if (mode === "create") {
      const created = await createDpr({ projectId: values.projectId, reportDate: values.reportDate, notes: values.notes, manpower, workItems }, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!dpr) return;
    const updated = await updateDpr(dpr.id, { reportDate: values.reportDate, notes: values.notes, manpower, workItems }, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="dpr-project" required error={errors.projectId?.message}>
          <Select id="dpr-project" disabled={mode === "edit"} invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.location}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Report Date" htmlFor="dpr-report-date" required error={errors.reportDate?.message}>
          <Input id="dpr-report-date" type="date" invalid={!!errors.reportDate} {...register("reportDate")} />
        </FormField>
      </div>

      <DPRManpowerEditor control={control} register={register} errors={errors} />

      <DPRWorkItemsEditor
        control={control}
        register={register}
        setValue={setValue}
        errors={errors}
        projectId={projectId}
        reportDate={reportDate}
        currentDprId={dpr?.id ?? null}
        history={history}
      />

      <FormField label="Notes (optional)" htmlFor="dpr-notes">
        <Textarea id="dpr-notes" {...register("notes")} />
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
          {mode === "create" ? "Save Daily Progress Report" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Plus, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useScheduleActivities } from "@/hooks/use-schedule";
import { DPR_WORK_CATEGORY_CONFIG, dprWorkItemsByCategory, getDPRWorkItem } from "@/lib/constants/dpr-work-items";
import type { DPRWorkItemHistoryEntry } from "@/lib/api/adapters/dpr-adapter";
import { getCumulativeQty, getLineUom, getPercentComplete, getPreviousQty } from "@/components/dpr/dpr-work-item-math";
import type { DPRFormValues } from "@/components/dpr/dpr-form-schema";
import type { DPRWorkCategory } from "@/types/domain/dpr";

const EMPTY_ROW = {
  workItemMasterId: "",
  otherDescription: "",
  otherUom: "",
  location: "",
  plannedQty: 0,
  todayQty: 0,
  remarks: "",
  scheduleActivityId: "",
};

/**
 * The owner-required work-item table (§7C): Sl. No. / Work Item /
 * Location / Unit / Planned / Previous / Today's / Cumulative / %
 * Complete / Remarks, plus the optional DPR → Schedule Tracking link.
 * Dynamic rows on `useFieldArray`, matching `MRCLineItemsEditor` (Part
 * 12); each row is its own subcomponent (`WorkItemRow`) so its `useWatch`
 * calls — needed for the live previous/cumulative/% preview as
 * `todayQty` changes — stay outside the `.map()` loop, same reasoning as
 * `MRCLineItemRow`/`LineItemAmount`.
 */
export function DPRWorkItemsEditor({
  control,
  register,
  setValue,
  errors,
  projectId,
  reportDate,
  currentDprId,
  history,
}: {
  control: Control<DPRFormValues>;
  register: UseFormRegister<DPRFormValues>;
  setValue: UseFormSetValue<DPRFormValues>;
  errors: FieldErrors<DPRFormValues>;
  projectId: string;
  reportDate: string;
  currentDprId: string | null;
  history: DPRWorkItemHistoryEntry[];
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "workItems" });
  const { result: scheduleResult } = useScheduleActivities({ projectId, page: 1, pageSize: 200, sortBy: "sequence", sortDir: "asc" });
  const scheduleActivities = scheduleResult?.items ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Work Items</p>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_ROW })}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Work Item
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="rounded-card border border-dashed border-border p-4 text-sm text-ink-muted">
          No work items logged yet today — add one, or leave this report as manpower-only.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <WorkItemRow
            key={field.id}
            index={index}
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            reportDate={reportDate}
            currentDprId={currentDprId}
            history={history}
            scheduleActivities={scheduleActivities}
            onRemove={() => remove(index)}
          />
        ))}
      </div>
    </div>
  );
}

function WorkItemRow({
  index,
  control,
  register,
  setValue,
  errors,
  reportDate,
  currentDprId,
  history,
  scheduleActivities,
  onRemove,
}: {
  index: number;
  control: Control<DPRFormValues>;
  register: UseFormRegister<DPRFormValues>;
  setValue: UseFormSetValue<DPRFormValues>;
  errors: FieldErrors<DPRFormValues>;
  reportDate: string;
  currentDprId: string | null;
  history: DPRWorkItemHistoryEntry[];
  scheduleActivities: { id: string; activity: string; uom: string }[];
  onRemove: () => void;
}) {
  const rowErrors = errors.workItems?.[index];
  const workItemMasterId = useWatch({ control, name: `workItems.${index}.workItemMasterId` });
  const todayQty = useWatch({ control, name: `workItems.${index}.todayQty` });
  const plannedQty = useWatch({ control, name: `workItems.${index}.plannedQty` });
  const otherUom = useWatch({ control, name: `workItems.${index}.otherUom` });
  const [category, setCategory] = useCategoryState(workItemMasterId);

  const master = getDPRWorkItem(workItemMasterId);
  const options = dprWorkItemsByCategory(category);

  const previousQty = workItemMasterId ? getPreviousQty(history, workItemMasterId, currentDprId, reportDate) : 0;
  const cumulativeQty = getCumulativeQty(previousQty, Number(todayQty) || 0);
  const percentComplete = getPercentComplete(cumulativeQty, Number(plannedQty) || 0);

  const handleWorkItemChange = (id: string) => {
    setValue(`workItems.${index}.workItemMasterId`, id);
    const picked = getDPRWorkItem(id);
    const latest = history
      .filter((h) => h.line.workItemMasterId === id && h.dpr.id !== currentDprId)
      .sort((a, b) => (a.dpr.reportDate < b.dpr.reportDate ? 1 : -1))[0];
    if (latest && !plannedQty) setValue(`workItems.${index}.plannedQty`, latest.line.plannedQty);
    if (!picked?.isOtherCatchAll) {
      setValue(`workItems.${index}.otherDescription`, "");
      setValue(`workItems.${index}.otherUom`, "");
    }
  };

  return (
    <div className="rounded-card border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor={`dpr-wi-category-${index}`}>Category</Label>
          <Select id={`dpr-wi-category-${index}`} className="mt-1.5" value={category} onChange={(e) => setCategory(e.target.value as DPRWorkCategory)}>
            {Object.entries(DPR_WORK_CATEGORY_CONFIG).map(([value, cfg]) => (
              <option key={value} value={value}>
                {cfg.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor={`dpr-wi-item-${index}`}>Work Item</Label>
          <Select
            id={`dpr-wi-item-${index}`}
            className="mt-1.5"
            invalid={!!rowErrors?.workItemMasterId}
            value={workItemMasterId}
            onChange={(e) => handleWorkItemChange(e.target.value)}
          >
            <option value="">Select a work item…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.slNo}. {o.description}
                {o.uom ? ` — ${o.uom}` : ""}
              </option>
            ))}
          </Select>
          {rowErrors?.workItemMasterId && <p className="mt-1 text-xs text-error">{rowErrors.workItemMasterId.message}</p>}
        </div>

        <div>
          <Label htmlFor={`dpr-wi-location-${index}`}>Location</Label>
          <Input id={`dpr-wi-location-${index}`} className="mt-1.5" placeholder="e.g. Ground Floor" {...register(`workItems.${index}.location`)} />
        </div>

        {master?.isOtherCatchAll && (
          <>
            <div>
              <Label htmlFor={`dpr-wi-other-desc-${index}`}>Describe the work</Label>
              <Input
                id={`dpr-wi-other-desc-${index}`}
                className="mt-1.5"
                invalid={!!rowErrors?.otherDescription}
                {...register(`workItems.${index}.otherDescription`)}
              />
              {rowErrors?.otherDescription && <p className="mt-1 text-xs text-error">{rowErrors.otherDescription.message}</p>}
            </div>
            <div>
              <Label htmlFor={`dpr-wi-other-uom-${index}`}>Unit</Label>
              <Input
                id={`dpr-wi-other-uom-${index}`}
                className="mt-1.5"
                placeholder="e.g. Item"
                invalid={!!rowErrors?.otherUom}
                {...register(`workItems.${index}.otherUom`)}
              />
              {rowErrors?.otherUom && <p className="mt-1 text-xs text-error">{rowErrors.otherUom.message}</p>}
            </div>
          </>
        )}

        <div>
          <Label htmlFor={`dpr-wi-planned-${index}`}>Planned Qty.</Label>
          <Input
            id={`dpr-wi-planned-${index}`}
            type="number"
            step="any"
            min={0}
            className="mt-1.5"
            invalid={!!rowErrors?.plannedQty}
            {...register(`workItems.${index}.plannedQty`)}
          />
        </div>

        <div>
          <Label htmlFor={`dpr-wi-today-${index}`}>Today&apos;s Qty.</Label>
          <Input
            id={`dpr-wi-today-${index}`}
            type="number"
            step="any"
            min={0}
            className="mt-1.5"
            invalid={!!rowErrors?.todayQty}
            {...register(`workItems.${index}.todayQty`)}
          />
        </div>

        <div className="flex flex-col justify-end text-xs text-ink-muted">
          <p>
            Previous: <span className="font-medium text-ink">{previousQty}</span> · Cumulative:{" "}
            <span className="font-medium text-ink">{cumulativeQty}</span> {master ? getLineUom(master, otherUom) : ""}
          </p>
          <p>
            % Complete: <span className="font-medium text-ink">{percentComplete.toFixed(0)}%</span>
          </p>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor={`dpr-wi-schedule-${index}`}>
            <Link2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            Link to Schedule Activity (optional)
          </Label>
          <Select id={`dpr-wi-schedule-${index}`} className="mt-1.5" {...register(`workItems.${index}.scheduleActivityId`)}>
            <option value="">Not linked</option>
            {scheduleActivities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.activity} ({a.uom})
              </option>
            ))}
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor={`dpr-wi-remarks-${index}`}>Remarks</Label>
          <Input id={`dpr-wi-remarks-${index}`} className="mt-1.5" {...register(`workItems.${index}.remarks`)} />
        </div>

        <div className="flex items-end justify-end">
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label="Remove work item">
            <Trash2 className="h-4 w-4 text-error" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Local-only UI state (which category the picker is currently filtered to) — derives its initial value from an already-selected work item, if any (e.g. when editing an existing DPR). */
function useCategoryState(workItemMasterId: string | undefined) {
  const initial = (workItemMasterId && getDPRWorkItem(workItemMasterId)?.category) || "civil";
  return useState<DPRWorkCategory>(initial);
}

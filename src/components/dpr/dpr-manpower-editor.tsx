"use client";

import { useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DPR_MANPOWER_CATEGORIES } from "@/components/dpr/dpr-manpower-config";
import { getTotalManpower } from "@/components/dpr/dpr-work-item-math";
import type { DPRFormValues } from "@/components/dpr/dpr-form-schema";

/**
 * The owner-required manpower table (§7C) — a **fixed** 8-row table, one
 * row per `DPRManpowerCategory` in a stable order (`DPR_MANPOWER_CATEGORIES`),
 * never a dynamic add/remove list the way `ManpowerCategory` might suggest.
 * `DPRForm` seeds all 8 rows up front (zero-filled when unused), so this
 * component only ever edits existing field-array slots by index — no
 * `useFieldArray` append/remove needed. Each row is its own subcomponent
 * (`ManpowerRow`) purely so its computed "Total" `useWatch` stays outside
 * the `.map()` loop, same reasoning as `MRCLineItemRow` (Part 12).
 */
export function DPRManpowerEditor({
  control,
  register,
  errors,
}: {
  control: Control<DPRFormValues>;
  register: UseFormRegister<DPRFormValues>;
  errors: FieldErrors<DPRFormValues>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-ink">Manpower</p>
      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-surface-muted text-left text-xs font-medium uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Skilled</th>
              <th className="px-3 py-2">Unskilled</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Agency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {DPR_MANPOWER_CATEGORIES.map((cat, index) => (
              <ManpowerRow key={cat.value} index={index} label={cat.label} control={control} register={register} errors={errors} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ManpowerRow({
  index,
  label,
  control,
  register,
  errors,
}: {
  index: number;
  label: string;
  control: Control<DPRFormValues>;
  register: UseFormRegister<DPRFormValues>;
  errors: FieldErrors<DPRFormValues>;
}) {
  const rowErrors = errors.manpower?.[index];
  const skilled = useWatch({ control, name: `manpower.${index}.skilled` });
  const unskilled = useWatch({ control, name: `manpower.${index}.unskilled` });
  const total = getTotalManpower(Number(skilled) || 0, Number(unskilled) || 0);

  return (
    <tr>
      <td className="whitespace-nowrap px-3 py-2 font-medium text-ink">{label}</td>
      <td className="px-3 py-2">
        <Label htmlFor={`dpr-mp-skilled-${index}`} className="sr-only">
          {label} skilled
        </Label>
        <Input
          id={`dpr-mp-skilled-${index}`}
          type="number"
          min={0}
          step="1"
          className="w-24"
          invalid={!!rowErrors?.skilled}
          {...register(`manpower.${index}.skilled`)}
        />
      </td>
      <td className="px-3 py-2">
        <Label htmlFor={`dpr-mp-unskilled-${index}`} className="sr-only">
          {label} unskilled
        </Label>
        <Input
          id={`dpr-mp-unskilled-${index}`}
          type="number"
          min={0}
          step="1"
          className="w-24"
          invalid={!!rowErrors?.unskilled}
          {...register(`manpower.${index}.unskilled`)}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-ink-muted">{total}</td>
      <td className="px-3 py-2">
        <Label htmlFor={`dpr-mp-agency-${index}`} className="sr-only">
          {label} agency
        </Label>
        <Input id={`dpr-mp-agency-${index}`} placeholder="Contractor/agency" className="w-48" {...register(`manpower.${index}.agency`)} />
      </td>
    </tr>
  );
}

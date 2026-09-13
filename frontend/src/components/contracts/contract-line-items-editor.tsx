"use client";

import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/utils/format";
import { CONTRACT_CATEGORY_CONFIG, CONTRACT_CATEGORY_ORDER } from "@/components/contracts/contract-category-config";
import type { ContractFormValues } from "@/components/contracts/contract-form-schema";

/**
 * Dynamic, editable line-item rows for `ContractForm` — the "editable
 * quantities" + "predefined category dropdown" the owner requirements ask
 * for. Built on `useFieldArray` (part of react-hook-form, already a
 * dependency — no new library added for this).
 */
export function ContractLineItemsEditor({
  control,
  register,
  errors,
}: {
  control: Control<ContractFormValues>;
  register: UseFormRegister<ContractFormValues>;
  errors: FieldErrors<ContractFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Line Items</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({ category: "civil", description: "", uom: "", quantity: 1, rate: 0 })
          }
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Line Item
        </Button>
      </div>

      {errors.lineItems?.root?.message && (
        <p role="alert" className="text-xs font-medium text-error">
          {errors.lineItems.root.message}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const rowErrors = errors.lineItems?.[index];
          return (
            <div key={field.id} className="rounded-card border border-border p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <div className="lg:col-span-1">
                  <Label htmlFor={`li-category-${index}`}>Category</Label>
                  <Select id={`li-category-${index}`} className="mt-1.5" {...register(`lineItems.${index}.category`)}>
                    {CONTRACT_CATEGORY_ORDER.map((cat) => (
                      <option key={cat} value={cat}>
                        {CONTRACT_CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="lg:col-span-2">
                  <Label htmlFor={`li-description-${index}`}>Description</Label>
                  <Input
                    id={`li-description-${index}`}
                    className="mt-1.5"
                    invalid={!!rowErrors?.description}
                    {...register(`lineItems.${index}.description`)}
                  />
                  {rowErrors?.description && <p className="mt-1 text-xs text-error">{rowErrors.description.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`li-uom-${index}`}>UOM</Label>
                  <Input id={`li-uom-${index}`} className="mt-1.5" placeholder="sq.ft" invalid={!!rowErrors?.uom} {...register(`lineItems.${index}.uom`)} />
                  {rowErrors?.uom && <p className="mt-1 text-xs text-error">{rowErrors.uom.message}</p>}
                </div>
                <div>
                  <Label htmlFor={`li-quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`li-quantity-${index}`}
                    type="number"
                    step="any"
                    className="mt-1.5"
                    invalid={!!rowErrors?.quantity}
                    {...register(`lineItems.${index}.quantity`)}
                  />
                  {rowErrors?.quantity && <p className="mt-1 text-xs text-error">{rowErrors.quantity.message}</p>}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`li-rate-${index}`}>Rate (₹)</Label>
                    <Input
                      id={`li-rate-${index}`}
                      type="number"
                      step="any"
                      className="mt-1.5"
                      invalid={!!rowErrors?.rate}
                      {...register(`lineItems.${index}.rate`)}
                    />
                    {rowErrors?.rate && <p className="mt-1 text-xs text-error">{rowErrors.rate.message}</p>}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    aria-label="Remove line item"
                  >
                    <Trash2 className="h-4 w-4 text-error" aria-hidden />
                  </Button>
                </div>
              </div>
              <LineItemAmount control={control} index={index} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineItemAmount({ control, index }: { control: Control<ContractFormValues>; index: number }) {
  // Kept as a tiny subscriber component so only this row's amount re-renders on keystroke.
  const quantity = useWatchNumber(control, `lineItems.${index}.quantity`);
  const rate = useWatchNumber(control, `lineItems.${index}.rate`);
  return <p className="mt-2 text-right text-xs text-ink-muted">Amount: {formatINR((quantity || 0) * (rate || 0))}</p>;
}

function useWatchNumber(control: Control<ContractFormValues>, name: `lineItems.${number}.quantity` | `lineItems.${number}.rate`) {
  const value = useWatch({ control, name });
  return typeof value === "number" ? value : Number(value) || 0;
}

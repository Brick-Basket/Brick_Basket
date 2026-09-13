"use client";

import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useGRNLinesForPicker, type GRNLinePickerOption } from "@/hooks/use-mrc";
import type { MRCFormValues } from "@/components/mrc/mrc-form-schema";

/**
 * Dynamic, editable line-item rows for `MRCForm` — one row per certified
 * material, each independently toggled between the two entry paths named
 * in `mrc.ts`'s `source` discriminator:
 *   - `"grn"` — pick a previously-received `GRNLineItem`; its description,
 *     UOM and make are snapshotted (shown read-only here, exactly like
 *     `GRNCreateForm` snapshots a PO line's description/UOM/rate) and its
 *     quantity is capped at what was actually received.
 *   - `"manual"` — free-text entry, mirroring Requisition's "additional
 *     item" rows (Part 8).
 * Built on `useFieldArray`, matching `ContractLineItemsEditor` (Part 5).
 * Each row is its own subcomponent (`MRCLineItemRow`) so its `useWatch`
 * calls stay outside the `.map()` loop, same reasoning as
 * `ContractLineItemsEditor`'s `LineItemAmount`.
 */
export function MRCLineItemsEditor({
  control,
  register,
  setValue,
  errors,
}: {
  control: Control<MRCFormValues>;
  register: UseFormRegister<MRCFormValues>;
  setValue: UseFormSetValue<MRCFormValues>;
  errors: FieldErrors<MRCFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const { status: pickerStatus, options } = useGRNLinesForPicker();
  const allLines = useWatch({ control, name: "lines" });
  const selectedGrnLineIds = (allLines ?? []).map((l) => l.grnLineItemId).filter((id): id is string => !!id);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Material Lines</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ source: "manual", description: "", uom: "", quantity: 1, make: "", warrantyTerms: "" })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Line
        </Button>
      </div>

      {errors.lines?.root?.message && (
        <p role="alert" className="text-xs font-medium text-error">
          {errors.lines.root.message}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <MRCLineItemRow
            key={field.id}
            index={index}
            control={control}
            register={register}
            setValue={setValue}
            errors={errors}
            options={options}
            pickerStatus={pickerStatus}
            selectedGrnLineIds={selectedGrnLineIds}
            onRemove={() => remove(index)}
            removeDisabled={fields.length === 1}
          />
        ))}
      </div>
    </div>
  );
}

function MRCLineItemRow({
  index,
  control,
  register,
  setValue,
  errors,
  options,
  pickerStatus,
  selectedGrnLineIds,
  onRemove,
  removeDisabled,
}: {
  index: number;
  control: Control<MRCFormValues>;
  register: UseFormRegister<MRCFormValues>;
  setValue: UseFormSetValue<MRCFormValues>;
  errors: FieldErrors<MRCFormValues>;
  options: GRNLinePickerOption[];
  pickerStatus: "idle" | "loading" | "success" | "error";
  selectedGrnLineIds: string[];
  onRemove: () => void;
  removeDisabled: boolean;
}) {
  const rowErrors = errors.lines?.[index];
  const source = useWatch({ control, name: `lines.${index}.source` });
  const grnLineItemId = useWatch({ control, name: `lines.${index}.grnLineItemId` });
  const selectedOption = options.find((o) => o.line.id === grnLineItemId);

  const handleSourceChange = (next: "grn" | "manual") => {
    setValue(`lines.${index}.source`, next);
    if (next === "manual") {
      setValue(`lines.${index}.grnLineItemId`, undefined);
      setValue(`lines.${index}.description`, "");
      setValue(`lines.${index}.uom`, "");
      setValue(`lines.${index}.make`, "");
    } else {
      setValue(`lines.${index}.description`, undefined);
      setValue(`lines.${index}.uom`, undefined);
      setValue(`lines.${index}.make`, undefined);
    }
  };

  const handleGrnLineChange = (lineId: string) => {
    const option = options.find((o) => o.line.id === lineId);
    setValue(`lines.${index}.grnLineItemId`, lineId);
    setValue(`lines.${index}.description`, option?.line.description ?? "");
    setValue(`lines.${index}.uom`, option?.line.uom ?? "");
    setValue(`lines.${index}.make`, option?.line.brand ?? "—");
    if (option) setValue(`lines.${index}.quantity`, option.line.receivedQuantity);
    if (option?.line.warrantyCertificateNumber) {
      setValue(`lines.${index}.warrantyTerms`, `Certificate ${option.line.warrantyCertificateNumber}`);
    }
  };

  return (
    <div className="rounded-card border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-1">
          <Label htmlFor={`mrcli-source-${index}`}>Source</Label>
          <Select
            id={`mrcli-source-${index}`}
            className="mt-1.5"
            value={source}
            onChange={(e) => handleSourceChange(e.target.value as "grn" | "manual")}
          >
            <option value="manual">Manual Entry</option>
            <option value="grn">From Received Goods (GRN)</option>
          </Select>
        </div>

        {source === "grn" ? (
          <div className="lg:col-span-3">
            <Label htmlFor={`mrcli-grn-${index}`}>Received Line</Label>
            {pickerStatus === "loading" ? (
              <LoadingSkeleton className="mt-1.5 h-11 w-full" />
            ) : (
              <Select
                id={`mrcli-grn-${index}`}
                className="mt-1.5"
                invalid={!!rowErrors?.grnLineItemId}
                value={grnLineItemId ?? ""}
                onChange={(e) => handleGrnLineChange(e.target.value)}
              >
                <option value="">Select a received line…</option>
                {options
                  .filter((o) => o.line.id === grnLineItemId || !selectedGrnLineIds.includes(o.line.id))
                  .map((o) => (
                    <option key={o.line.id} value={o.line.id}>
                      {o.grn.grnNumber} — {o.line.description} (received {o.line.receivedQuantity} {o.line.uom})
                    </option>
                  ))}
              </Select>
            )}
            {rowErrors?.grnLineItemId && <p className="mt-1 text-xs text-error">{rowErrors.grnLineItemId.message}</p>}
            {selectedOption && (
              <p className="mt-1.5 text-xs text-ink-muted">
                Make: {selectedOption.line.brand ?? "—"} · UOM: {selectedOption.line.uom}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="lg:col-span-2">
              <Label htmlFor={`mrcli-description-${index}`}>Description</Label>
              <Input
                id={`mrcli-description-${index}`}
                className="mt-1.5"
                invalid={!!rowErrors?.description}
                {...register(`lines.${index}.description`)}
              />
              {rowErrors?.description && <p className="mt-1 text-xs text-error">{rowErrors.description.message}</p>}
            </div>
            <div>
              <Label htmlFor={`mrcli-uom-${index}`}>UOM</Label>
              <Input
                id={`mrcli-uom-${index}`}
                className="mt-1.5"
                placeholder="each"
                invalid={!!rowErrors?.uom}
                {...register(`lines.${index}.uom`)}
              />
              {rowErrors?.uom && <p className="mt-1 text-xs text-error">{rowErrors.uom.message}</p>}
            </div>
          </>
        )}

        <div>
          <Label htmlFor={`mrcli-quantity-${index}`}>Quantity</Label>
          <Input
            id={`mrcli-quantity-${index}`}
            type="number"
            step="any"
            max={selectedOption?.line.receivedQuantity}
            className="mt-1.5"
            invalid={!!rowErrors?.quantity}
            {...register(`lines.${index}.quantity`)}
          />
          {rowErrors?.quantity && <p className="mt-1 text-xs text-error">{rowErrors.quantity.message}</p>}
          {selectedOption && (
            <p className="mt-1 text-xs text-ink-muted">
              Max {selectedOption.line.receivedQuantity} {selectedOption.line.uom}
            </p>
          )}
        </div>

        {source === "manual" && (
          <div>
            <Label htmlFor={`mrcli-make-${index}`}>Make</Label>
            <Input id={`mrcli-make-${index}`} className="mt-1.5" invalid={!!rowErrors?.make} {...register(`lines.${index}.make`)} />
            {rowErrors?.make && <p className="mt-1 text-xs text-error">{rowErrors.make.message}</p>}
          </div>
        )}

        <div className="flex items-end gap-2 lg:col-span-2">
          <div className="flex-1">
            <Label htmlFor={`mrcli-warranty-${index}`}>Warranty Terms (optional)</Label>
            <Input
              id={`mrcli-warranty-${index}`}
              className="mt-1.5"
              placeholder="e.g. 12 months from installation"
              {...register(`lines.${index}.warrantyTerms`)}
            />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} disabled={removeDisabled} aria-label="Remove line">
            <Trash2 className="h-4 w-4 text-error" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

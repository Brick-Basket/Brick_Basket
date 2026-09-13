"use client";

import { useFieldArray, useWatch, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useACEItems } from "@/hooks/use-ace";
import type { ACEItem } from "@/types/domain/ace-item";
import type { RequisitionFormValues } from "@/components/requisitions/requisition-form-schema";

/**
 * Dynamic, editable requirement rows for `RequisitionForm` — the "Item
 * picker" (source: `"predefined"`, scoped to this requisition's project's
 * `ACEItem`s — the ACE → Requisition reference Part 8 asks to wire) and
 * "Additional item row" (source: `"additional"`, free text) the owner
 * requirements ask for. Built on `useFieldArray` — no new dependency.
 */
export function MaterialRequirementEditor({
  control,
  register,
  errors,
  setValue,
  projectId,
}: {
  control: Control<RequisitionFormValues>;
  register: UseFormRegister<RequisitionFormValues>;
  errors: FieldErrors<RequisitionFormValues>;
  setValue: UseFormSetValue<RequisitionFormValues>;
  projectId: string;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const { result: aceResult } = useACEItems({ projectId: projectId || undefined, pageSize: 200, sortBy: "itemDescription", sortDir: "asc" });
  const aceItems = aceResult?.items ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Requirement Items</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ source: "additional", description: "", uom: "", quantity: 1, brand: "" })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Item
        </Button>
      </div>

      {errors.lines?.root?.message && (
        <p role="alert" className="text-xs font-medium text-error">
          {errors.lines.root.message}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <MaterialRequirementRow
            key={field.id}
            index={index}
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
            projectId={projectId}
            aceItems={aceItems}
            onRemove={() => remove(index)}
            removable={fields.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Kept as its own component (not inlined in the `.map()` above) because it
 * calls `useWatch` — a hook can't be called from inside a loop/callback in
 * the parent's body, only from a genuine component instance. Same pattern
 * as `ContractLineItemsEditor`'s `LineItemAmount`.
 */
function MaterialRequirementRow({
  index,
  control,
  register,
  errors,
  setValue,
  projectId,
  aceItems,
  onRemove,
  removable,
}: {
  index: number;
  control: Control<RequisitionFormValues>;
  register: UseFormRegister<RequisitionFormValues>;
  errors: FieldErrors<RequisitionFormValues>;
  setValue: UseFormSetValue<RequisitionFormValues>;
  projectId: string;
  aceItems: ACEItem[];
  onRemove: () => void;
  removable: boolean;
}) {
  const rowErrors = errors.lines?.[index];
  const source = useWatch({ control, name: `lines.${index}.source` });
  const aceItemId = useWatch({ control, name: `lines.${index}.aceItemId` });

  return (
    <div className="rounded-card border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <Label htmlFor={`mr-source-${index}`}>Source</Label>
          <Select
            id={`mr-source-${index}`}
            className="mt-1.5"
            {...register(`lines.${index}.source`)}
            onChange={(e) => {
              setValue(`lines.${index}.source`, e.target.value as "predefined" | "additional");
              if (e.target.value === "additional") {
                setValue(`lines.${index}.aceItemId`, undefined);
              }
            }}
          >
            <option value="predefined">Predefined (ACE)</option>
            <option value="additional">Additional</option>
          </Select>
        </div>

        {source === "predefined" ? (
          <div className="lg:col-span-2">
            <Label htmlFor={`mr-ace-${index}`}>Item (from ACE)</Label>
            <Select
              id={`mr-ace-${index}`}
              className="mt-1.5"
              invalid={!!rowErrors?.aceItemId}
              value={aceItemId ?? ""}
              disabled={!projectId}
              onChange={(e) => {
                const selected = aceItems.find((i) => i.id === e.target.value);
                setValue(`lines.${index}.aceItemId`, e.target.value || undefined);
                if (selected) {
                  setValue(`lines.${index}.description`, selected.itemDescription);
                  setValue(`lines.${index}.uom`, selected.uom);
                }
              }}
            >
              <option value="">{projectId ? "Select an item…" : "Select a project first"}</option>
              {aceItems.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.itemDescription}
                </option>
              ))}
            </Select>
            {/* FRONTEND IMPLEMENTATION DECISION (Phase 12 fix): aceItemId is
               now required when source === "predefined" (see
               requisition-form-schema.ts) — surface that error inline,
               same as every other row field. */}
            {rowErrors?.aceItemId && <p className="mt-1 text-xs text-error">{rowErrors.aceItemId.message}</p>}
          </div>
        ) : (
          <div className="lg:col-span-2">
            <Label htmlFor={`mr-description-${index}`}>Description</Label>
            <Input id={`mr-description-${index}`} className="mt-1.5" invalid={!!rowErrors?.description} {...register(`lines.${index}.description`)} />
          </div>
        )}

        <div>
          <Label htmlFor={`mr-uom-${index}`}>UOM</Label>
          <Input
            id={`mr-uom-${index}`}
            className="mt-1.5"
            placeholder="kg, sq.ft, each…"
            disabled={source === "predefined"}
            invalid={!!rowErrors?.uom}
            {...register(`lines.${index}.uom`)}
          />
        </div>
        <div>
          <Label htmlFor={`mr-quantity-${index}`}>Quantity</Label>
          <Input id={`mr-quantity-${index}`} type="number" step="any" className="mt-1.5" invalid={!!rowErrors?.quantity} {...register(`lines.${index}.quantity`)} />
          {rowErrors?.quantity && <p className="mt-1 text-xs text-error">{rowErrors.quantity.message}</p>}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor={`mr-brand-${index}`}>Brand (optional)</Label>
            <Input id={`mr-brand-${index}`} className="mt-1.5" {...register(`lines.${index}.brand`)} />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove} disabled={!removable} aria-label="Remove item">
            <Trash2 className="h-4 w-4 text-error" aria-hidden />
          </Button>
        </div>
      </div>
      {rowErrors?.description && <p className="mt-1 text-xs text-error">{rowErrors.description.message}</p>}
    </div>
  );
}

"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateFixedAsset, useUpdateFixedAsset } from "@/hooks/use-fixed-assets";
import { FIXED_ASSET_CATEGORY_CONFIG, FIXED_ASSET_MIN_VALUE } from "@/components/finance/fixed-asset-config";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import type { FixedAsset } from "@/types/domain/fixed-asset";

const assetFormSchema = z.object({
  assetName: z.string().min(1, "Add an asset name"),
  category: z.enum(["equipment", "vehicle", "furniture", "it_computer", "tools_machinery", "other"]),
  value: z.coerce.number().gt(FIXED_ASSET_MIN_VALUE, `Fixed Assets tracks items valued above ₹${FIXED_ASSET_MIN_VALUE.toLocaleString("en-IN")} only`),
  purchaseDate: z.string().min(1, "Add a purchase date"),
  vendorId: z.string().optional(),
  projectId: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(["active", "disposed"]),
  disposedAt: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

/**
 * Create/edit form for `/admin/finance/fixed-assets`, embedded in a
 * Dialog. `value` must be above the owner's stated ₹5,000 threshold
 * (§8E) — the one owner-confirmed rule this module has.
 */
export function FixedAssetForm({
  mode,
  asset,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  asset?: FixedAsset;
  onCancel: () => void;
  onSuccess: (asset: FixedAsset) => void;
}) {
  const { session } = useSession();
  const { submit: createAsset, status: createStatus, error: createError } = useCreateFixedAsset();
  const { submit: updateAsset, status: updateStatus, error: updateError } = useUpdateFixedAsset();
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetName: asset?.assetName ?? "",
      category: asset?.category ?? "equipment",
      value: asset?.value ?? FIXED_ASSET_MIN_VALUE + 1,
      purchaseDate: asset?.purchaseDate ?? "",
      vendorId: asset?.vendorId ?? "",
      projectId: asset?.projectId ?? "",
      serialNumber: asset?.serialNumber ?? "",
      status: asset?.status ?? "active",
      disposedAt: asset?.disposedAt ?? "",
      notes: asset?.notes ?? "",
    },
  });

  const status = useWatch({ control, name: "status" });

  const onSubmit = async (values: AssetFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const input = {
      assetName: values.assetName,
      category: values.category,
      value: values.value,
      purchaseDate: values.purchaseDate,
      vendorId: values.vendorId || undefined,
      projectId: values.projectId || undefined,
      serialNumber: values.serialNumber || undefined,
      status: values.status,
      disposedAt: values.status === "disposed" ? values.disposedAt || null : null,
      notes: values.notes || undefined,
    };

    if (mode === "create") {
      const created = await createAsset(input, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!asset) return;
    const updated = await updateAsset(asset.id, input, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Asset Name" htmlFor="asset-name" required error={errors.assetName?.message}>
        <Input id="asset-name" invalid={!!errors.assetName} {...register("assetName")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Category" htmlFor="asset-category" required>
          <Select id="asset-category" {...register("category")}>
            {Object.entries(FIXED_ASSET_CATEGORY_CONFIG).map(([value, cfg]) => (
              <option key={value} value={value}>
                {cfg.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="Value (₹)"
          htmlFor="asset-value"
          required
          error={errors.value?.message}
          hint={`Only assets above ₹${FIXED_ASSET_MIN_VALUE.toLocaleString("en-IN")} belong in this register.`}
        >
          <Input id="asset-value" type="number" step="any" invalid={!!errors.value} {...register("value")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Purchase Date" htmlFor="asset-purchase-date" required error={errors.purchaseDate?.message}>
          <Input id="asset-purchase-date" type="date" invalid={!!errors.purchaseDate} {...register("purchaseDate")} />
        </FormField>
        <FormField label="Serial Number (optional)" htmlFor="asset-serial">
          <Input id="asset-serial" {...register("serialNumber")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Vendor (optional)" htmlFor="asset-vendor" hint="When bought from a vendor already on file.">
          <Select id="asset-vendor" {...register("vendorId")}>
            <option value="">Not linked to a vendor</option>
            {allVendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.tradeName}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Project (optional)" htmlFor="asset-project" hint="Leave unset for an organization-wide asset.">
          <Select id="asset-project" {...register("projectId")}>
            <option value="">Organization-wide</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Status" htmlFor="asset-status" required>
          <Select id="asset-status" {...register("status")}>
            <option value="active">Active</option>
            <option value="disposed">Disposed</option>
          </Select>
        </FormField>
        {status === "disposed" && (
          <FormField label="Disposed On" htmlFor="asset-disposed-at">
            <Input id="asset-disposed-at" type="date" {...register("disposedAt")} />
          </FormField>
        )}
      </div>

      <FormField label="Notes (optional)" htmlFor="asset-notes">
        <Textarea id="asset-notes" {...register("notes")} />
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
          {mode === "create" ? "Add Asset" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

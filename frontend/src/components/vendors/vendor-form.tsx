"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateVendor, useUpdateVendor } from "@/hooks/use-vendors";
import {
  VENDOR_CODE_SERIES_CONFIG,
  VENDOR_CODE_SERIES_ORDER,
  VENDOR_GST_CATEGORY_CONFIG,
  VENDOR_GST_CATEGORY_ORDER,
  VENDOR_NATURE_CONFIG,
  VENDOR_NATURE_ORDER,
} from "@/components/vendors/vendor-config";
import type { Vendor } from "@/types/domain/vendor";

const vendorFormSchema = z
  .object({
    tradeName: z.string().min(1, "Trade name is required"),
    gstCategory: z.enum(["registered", "non_registered"]),
    gstin: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    msmeUdyamNumber: z.string().optional(),
    contactPerson: z.string().min(1, "Contact person is required"),
    contactPersonDesignation: z.string().min(1, "Designation is required"),
    email: z.string().email("Enter a valid email address"),
    contactNumber: z.string().min(1, "Contact number is required"),
    nature: z.enum(["supply", "service", "service_and_supply"]),
    codeSeriesCategory: z.enum([
      "service_and_supply",
      "service",
      "supply",
      "specialised_work",
      "machinery_hiring",
      "design_detailing_consultancy",
    ]),
    turnover: z.coerce.number().min(0, "Turnover cannot be negative"),
  })
  .refine((data) => data.gstCategory !== "registered" || !!data.gstin?.trim(), {
    message: "GSTIN is required for a GST-registered vendor",
    path: ["gstin"],
  });

type VendorFormValues = z.infer<typeof vendorFormSchema>;

/**
 * Create/edit form for the admin Vendor Management module. `codeSeriesCategory`
 * is only editable in `"create"` mode — a vendor's code is assigned once
 * from that series and is a permanent identifier afterward (see
 * `src/types/domain/vendor.ts`'s header comment).
 */
export function VendorForm({
  mode,
  vendor,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  vendor?: Vendor;
  onSuccess: (vendor: Vendor) => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const { submit: createVendor, status: createStatus, error: createError } = useCreateVendor();
  const { submit: updateVendor, status: updateStatus, error: updateError } = useUpdateVendor();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      tradeName: vendor?.tradeName ?? "",
      gstCategory: vendor?.gstCategory ?? "registered",
      gstin: vendor?.gstin ?? "",
      address: vendor?.address ?? "",
      msmeUdyamNumber: vendor?.msmeUdyamNumber ?? "",
      contactPerson: vendor?.contactPerson ?? "",
      contactPersonDesignation: vendor?.contactPersonDesignation ?? "",
      email: vendor?.email ?? "",
      contactNumber: vendor?.contactNumber ?? "",
      nature: vendor?.nature ?? "supply",
      codeSeriesCategory: vendor?.codeSeriesCategory ?? "supply",
      turnover: vendor?.turnover ?? 0,
    },
  });

  const gstCategory = watch("gstCategory");

  const onSubmit = async (values: VendorFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const payload = {
      tradeName: values.tradeName,
      gstCategory: values.gstCategory,
      gstin: values.gstCategory === "registered" ? values.gstin : undefined,
      address: values.address,
      msmeUdyamNumber: values.msmeUdyamNumber || undefined,
      contactPerson: values.contactPerson,
      contactPersonDesignation: values.contactPersonDesignation,
      email: values.email,
      contactNumber: values.contactNumber,
      nature: values.nature,
      turnover: values.turnover,
    };

    if (mode === "create") {
      const created = await createVendor({ ...payload, codeSeriesCategory: values.codeSeriesCategory }, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!vendor) return;
    const updated = await updateVendor(vendor.id, payload, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Trade Name" htmlFor="vendor-trade-name" required error={errors.tradeName?.message}>
          <Input id="vendor-trade-name" invalid={!!errors.tradeName} {...register("tradeName")} />
        </FormField>
        <FormField
          label="Vendor Code Series Category"
          htmlFor="vendor-code-series"
          required
          hint={mode === "edit" ? "Set once at creation — a vendor's code series can't be changed afterward." : "Determines which code series this vendor's number is assigned from."}
        >
          <Select id="vendor-code-series" disabled={mode === "edit"} {...register("codeSeriesCategory")}>
            {VENDOR_CODE_SERIES_ORDER.map((c) => (
              <option key={c} value={c}>
                Series {VENDOR_CODE_SERIES_CONFIG[c].seriesNumber} — {VENDOR_CODE_SERIES_CONFIG[c].label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="GST Category" htmlFor="vendor-gst-category" required>
          <Select id="vendor-gst-category" {...register("gstCategory")}>
            {VENDOR_GST_CATEGORY_ORDER.map((g) => (
              <option key={g} value={g}>
                {VENDOR_GST_CATEGORY_CONFIG[g].label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label="GSTIN"
          htmlFor="vendor-gstin"
          required={gstCategory === "registered"}
          error={errors.gstin?.message}
          hint={gstCategory === "non_registered" ? "Not applicable for a non-registered vendor." : undefined}
        >
          <Input id="vendor-gstin" invalid={!!errors.gstin} disabled={gstCategory === "non_registered"} {...register("gstin")} />
        </FormField>
      </div>

      <FormField label="Address" htmlFor="vendor-address" required error={errors.address?.message}>
        <Input id="vendor-address" invalid={!!errors.address} {...register("address")} />
      </FormField>

      <FormField label="MSME/UDYAM Certificate Number (optional)" htmlFor="vendor-msme">
        <Input id="vendor-msme" {...register("msmeUdyamNumber")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Contact Person" htmlFor="vendor-contact-person" required error={errors.contactPerson?.message}>
          <Input id="vendor-contact-person" invalid={!!errors.contactPerson} {...register("contactPerson")} />
        </FormField>
        <FormField
          label="Contact Person Designation"
          htmlFor="vendor-contact-designation"
          required
          error={errors.contactPersonDesignation?.message}
        >
          <Input id="vendor-contact-designation" invalid={!!errors.contactPersonDesignation} {...register("contactPersonDesignation")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Email" htmlFor="vendor-email" required error={errors.email?.message}>
          <Input id="vendor-email" type="email" invalid={!!errors.email} {...register("email")} />
        </FormField>
        <FormField label="Contact Number" htmlFor="vendor-contact-number" required error={errors.contactNumber?.message}>
          <Input id="vendor-contact-number" invalid={!!errors.contactNumber} {...register("contactNumber")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nature" htmlFor="vendor-nature" required>
          <Select id="vendor-nature" {...register("nature")}>
            {VENDOR_NATURE_ORDER.map((n) => (
              <option key={n} value={n}>
                {VENDOR_NATURE_CONFIG[n].label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Turnover (₹ per year)" htmlFor="vendor-turnover" required error={errors.turnover?.message}>
          <Input id="vendor-turnover" type="number" min={0} step="1000" invalid={!!errors.turnover} {...register("turnover")} />
        </FormField>
      </div>

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
          {mode === "create" ? "Create Vendor" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

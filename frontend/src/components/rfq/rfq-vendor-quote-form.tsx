"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import type { Vendor } from "@/types/domain/vendor";

const quoteFormSchema = z.object({
  vendorId: z.string().min(1, "Select a vendor"),
  rate: z.coerce.number().positive("Rate must be greater than 0"),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

/**
 * Small "add a vendor's quote for this line" form, embedded in a Dialog
 * from `RFQComparisonTable`. `availableVendors` is already filtered to
 * exclude vendors that have already quoted this line — the max-3-per-line
 * rule is enforced by `RFQAdapter.setVendorQuote`, this form just avoids
 * offering a vendor twice.
 */
export function RFQVendorQuoteForm({
  availableVendors,
  onCancel,
  onSubmit,
  submitting,
  error,
}: {
  availableVendors: Vendor[];
  onCancel: () => void;
  onSubmit: (values: { vendorId: string; rate: number }) => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormValues>({ resolver: zodResolver(quoteFormSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Vendor" htmlFor="quote-vendor" required error={errors.vendorId?.message}>
        <Select id="quote-vendor" invalid={!!errors.vendorId} {...register("vendorId")}>
          <option value="">Select a vendor…</option>
          {availableVendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.tradeName} — {v.vendorCode}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Quoted Rate (₹)" htmlFor="quote-rate" required error={errors.rate?.message} hint="Demo/mock value only — not real vendor pricing.">
        <Input id="quote-rate" type="number" step="any" invalid={!!errors.rate} {...register("rate")} />
      </FormField>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || availableVendors.length === 0}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Add Quote
        </Button>
      </div>
    </form>
  );
}

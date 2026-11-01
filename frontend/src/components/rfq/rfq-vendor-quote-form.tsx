"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import type { Vendor } from "@/types/domain/vendor";

const quoteFormSchema = z.object({
  vendorId: z.string().min(1, "Select a vendor"),
  rate: z.coerce.number().positive("Rate must be greater than 0"),
  // docs/OPEN_QUESTIONS.md #87(a) — optional landed-cost components. A
  // blank input coerces to `0` here (same as every other numeric field in
  // this app's forms), which is indistinguishable from "unset" everywhere
  // these are read (`computeLandedCost`'s `?? 0`, the comparison table's
  // `hasCharges` check) — so leaving these blank is exactly equivalent to
  // never having added them.
  freight: z.coerce.number().min(0, "Must be 0 or more").optional(),
  loadingCharges: z.coerce.number().min(0, "Must be 0 or more").optional(),
  otherCharges: z.coerce.number().min(0, "Must be 0 or more").optional(),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

/**
 * Small "add a vendor's quote for this line" form, embedded in a Dialog
 * from `RFQComparisonTable`. `availableVendors` is already filtered to
 * exclude vendors that have already quoted this line — the max-3-per-line
 * rule is enforced by `RFQAdapter.setVendorQuote`, this form just avoids
 * offering a vendor twice.
 *
 * Document 2 correction: an optional file input lets the purchaser attach
 * the vendor's offer/quotation alongside the quoted rate — see
 * `RFQVendorQuote`'s header comment in `src/types/domain/rfq.ts`.
 *
 * docs/OPEN_QUESTIONS.md #87(a): three optional "delivery charge" fields
 * (freight/loading/other) feed `computeLandedCost` in the comparison
 * table — left blank, a quote behaves exactly as it did before this
 * change (ranked and totaled on tax-inclusive rate alone).
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
  onSubmit: (values: {
    vendorId: string;
    rate: number;
    file: File | null;
    freight?: number;
    loadingCharges?: number;
    otherCharges?: number;
  }) => void;
  submitting?: boolean;
  error?: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuoteFormValues>({ resolver: zodResolver(quoteFormSchema) });

  const submit = (values: QuoteFormValues) => onSubmit({ ...values, file });

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4" noValidate>
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

      <div className="grid grid-cols-3 gap-3">
        <FormField label="Freight (₹)" htmlFor="quote-freight" error={errors.freight?.message} hint="Optional">
          <Input id="quote-freight" type="number" step="any" min={0} invalid={!!errors.freight} {...register("freight")} />
        </FormField>
        <FormField label="Loading (₹)" htmlFor="quote-loading" error={errors.loadingCharges?.message} hint="Optional">
          <Input id="quote-loading" type="number" step="any" min={0} invalid={!!errors.loadingCharges} {...register("loadingCharges")} />
        </FormField>
        <FormField label="Other (₹)" htmlFor="quote-other" error={errors.otherCharges?.message} hint="Optional">
          <Input id="quote-other" type="number" step="any" min={0} invalid={!!errors.otherCharges} {...register("otherCharges")} />
        </FormField>
      </div>
      <p className="-mt-2 text-xs text-ink-muted">
        Delivery charges in addition to the quoted rate — included in this vendor&apos;s landed cost for ranking. Leave blank if not applicable.
      </p>

      <div>
        <Label htmlFor="quote-attachment">Vendor Offer/Quotation (optional)</Label>
        <div className="mt-1.5">
          <Input id="quote-attachment" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-auto py-2" />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          No backend file storage yet — attaching here only keeps the file in this browser tab for this session.
        </p>
      </div>

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

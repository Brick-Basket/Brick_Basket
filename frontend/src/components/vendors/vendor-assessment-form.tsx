"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { useSession } from "@/components/providers/auth-provider";
import { useAddVendorAssessment } from "@/hooks/use-vendors";
import { VENDOR_ASSESSMENT_CRITERIA } from "@/components/vendors/vendor-rating";
import type { Vendor } from "@/types/domain/vendor";

const assessmentFormSchema = z.object({
  quality: z.coerce.number().min(0, "Must be 0–10").max(10, "Must be 0–10"),
  timelineAdherence: z.coerce.number().min(0, "Must be 0–10").max(10, "Must be 0–10"),
  futureBusinessProbability: z.coerce.number().min(0, "Must be 0–10").max(10, "Must be 0–10"),
  presentCapacity: z.coerce.number().min(0, "Must be 0–10").max(10, "Must be 0–10"),
  notes: z.string().optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

/** New assessment form, embedded on the vendor detail page (`vendors:assess`). Every submission is a new, dated history entry — never overwrites a previous assessment. */
export function VendorAssessmentForm({
  vendor,
  onCancel,
  onSuccess,
}: {
  vendor: Vendor;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const { session } = useSession();
  const { submit: addAssessment, status, error } = useAddVendorAssessment();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: { quality: 5, timelineAdherence: 5, futureBusinessProbability: 5, presentCapacity: 5, notes: "" },
  });

  const onSubmit = async (values: AssessmentFormValues) => {
    if (!session) return;
    const created = await addAssessment(
      vendor.id,
      {
        quality: values.quality,
        timelineAdherence: values.timelineAdherence,
        futureBusinessProbability: values.futureBusinessProbability,
        presentCapacity: values.presentCapacity,
        notes: values.notes,
      },
      { id: session.user.id, name: session.user.name },
    );
    if (created) onSuccess();
  };

  const submitting = isSubmitting || status === "loading";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-card border border-border bg-surface-muted p-4" noValidate>
      <p className="text-sm font-medium text-ink">New Assessment</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {VENDOR_ASSESSMENT_CRITERIA.map((criterion) => (
          <FormField key={criterion.key} label={criterion.label} htmlFor={`assess-${criterion.key}`} error={errors[criterion.key]?.message}>
            <Input
              id={`assess-${criterion.key}`}
              type="number"
              min={0}
              max={10}
              step={1}
              invalid={!!errors[criterion.key]}
              {...register(criterion.key)}
            />
          </FormField>
        ))}
      </div>
      <FormField label="Notes (optional)" htmlFor="assess-notes">
        <Textarea id="assess-notes" {...register("notes")} />
      </FormField>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Save Assessment
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { useCreateLead, useUpdateLead } from "@/hooks/use-leads";
import { assignableStaffDirectory } from "@/lib/auth/mock-users";
import { LEAD_SOURCE_CONFIG } from "@/components/leads/lead-source-config";
import type { Lead } from "@/types/domain/lead";

function today() {
  return new Date().toISOString().slice(0, 10);
}

const leadFormSchema = z.object({
  name: z.string().min(2, "Enter the lead's full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(8, "Enter a valid phone number"),
  source: z.enum(["website", "social_media", "call_whatsapp", "personal_reference"]),
  city: z.string().min(2, "Add a city"),
  receivedDate: z.string().min(1, "Add the date of receipt"),
  subject: z.string().min(3, "Add a subject"),
  message: z.string().min(5, "Add a few details"),
  assignedTo: z.string(),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

/**
 * Create/edit form for the admin Lead Management module. `mode: "create"`
 * logs a manually-captured lead (a call, a walk-in) — assignment happens
 * afterwards via edit, matching `CreateLeadInput`'s shape (server owns
 * assignment at creation, per `lead.ts`). `mode: "edit"` additionally
 * allows reassigning staff. Pipeline-status changes happen from the
 * table/Kanban, not this form — see `lead-status-config.ts`.
 *
 * `city` (owner correction #7) and `receivedDate` (owner correction #3) are
 * both required here even though they're optional on `CreateLeadInput` at
 * the type level — that looser typing exists only so the public Contact
 * form still compiles; this admin form enforces both via the zod schema.
 */
export function LeadForm({
  mode,
  lead,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  lead?: Lead;
  onSuccess: (lead: Lead) => void;
  onCancel: () => void;
}) {
  const { submit: createLead, status: createStatus, error: createError } = useCreateLead();
  const { submit: updateLead, status: updateStatus, error: updateError } = useUpdateLead();
  const staff = assignableStaffDirectory();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: lead?.name ?? "",
      email: lead?.email ?? "",
      phone: lead?.phone ?? "",
      source: lead?.source ?? "website",
      city: lead?.city ?? "",
      receivedDate: lead?.receivedDate ?? today(),
      subject: lead?.subject ?? "",
      message: lead?.message ?? "",
      assignedTo: lead?.assignedTo ?? "",
    },
  });

  const cityValue = watch("city");

  const onSubmit = async (values: LeadFormValues) => {
    if (mode === "create") {
      const created = await createLead({
        name: values.name,
        email: values.email,
        phone: values.phone,
        source: values.source,
        city: values.city,
        receivedDate: values.receivedDate,
        subject: values.subject,
        message: values.message,
      });
      if (created) onSuccess(created);
      return;
    }
    if (!lead) return;
    const updated = await updateLead(lead.id, {
      name: values.name,
      email: values.email,
      phone: values.phone,
      city: values.city,
      receivedDate: values.receivedDate,
      subject: values.subject,
      message: values.message,
      assignedTo: values.assignedTo || null,
    });
    if (updated) onSuccess(updated);
  };

  const submitError = mode === "create" ? createError : updateError;
  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full Name" htmlFor="lead-name" required error={errors.name?.message}>
          <Input id="lead-name" invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="lead-email" required error={errors.email?.message}>
          <Input id="lead-email" type="email" invalid={!!errors.email} {...register("email")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Phone" htmlFor="lead-phone" required error={errors.phone?.message}>
          <Input id="lead-phone" type="tel" invalid={!!errors.phone} {...register("phone")} />
        </FormField>
        <FormField label="Source" htmlFor="lead-source" required error={errors.source?.message}>
          <Select id="lead-source" disabled={mode === "edit"} {...register("source")}>
            {Object.entries(LEAD_SOURCE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" htmlFor="lead-city" required error={errors.city?.message} hint="Start typing — pick from the list, or enter your own.">
          <CityAutocomplete
            id="lead-city"
            value={cityValue}
            invalid={!!errors.city}
            ariaLabel="City"
            onValueChange={(v) => setValue("city", v, { shouldValidate: true, shouldDirty: true })}
            onSelectCity={(c) => setValue("city", c.city, { shouldValidate: true, shouldDirty: true })}
          />
        </FormField>
        <FormField
          label="Date of Receipt"
          htmlFor="lead-received-date"
          required
          error={errors.receivedDate?.message}
          hint="When the enquiry actually came in — can be earlier than today."
        >
          <Input id="lead-received-date" type="date" max={today()} invalid={!!errors.receivedDate} {...register("receivedDate")} />
        </FormField>
      </div>

      <FormField label="Subject" htmlFor="lead-subject" required error={errors.subject?.message}>
        <Input id="lead-subject" invalid={!!errors.subject} {...register("subject")} />
      </FormField>

      <FormField label="Message / Notes" htmlFor="lead-message" required error={errors.message?.message}>
        <Textarea id="lead-message" invalid={!!errors.message} {...register("message")} />
      </FormField>

      {mode === "edit" && (
        <FormField label="Assigned To" htmlFor="lead-assignee" hint="Who on the team is following up on this lead.">
          <Select id="lead-assignee" {...register("assignedTo")}>
            <option value="">Unassigned</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {submitError && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {submitError}
        </div>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {mode === "create" ? "Create Lead" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

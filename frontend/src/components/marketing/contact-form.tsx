"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { useCreateLead } from "@/hooks/use-create-lead";
import { CONTACT_SUBJECT_OPTIONS } from "@/lib/content/public-site";
import { useLanguage } from "@/components/providers/language-provider";
import { localize, CONTACT_SUBJECT_HI } from "@/lib/i18n/translations";

// Validation messages stay in English at the schema level (zod's messages
// are also what a real backend's equivalent validation would show, and
// aren't re-read reactively on language switch here) — the *visible* label/
// placeholder/success/error copy around the form is what's translated,
// same scope as every other form in this pass. See docs/OPEN_QUESTIONS.md #77.
const contactSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(8, "Enter a valid phone number"),
  subject: z.string().min(3, "Let us know what this is about"),
  // FRONTEND IMPLEMENTATION DECISION (this pass): message is optional —
  // no minimum length, and left blank is a valid submission. `CreateLeadInput`
  // still types `message` as a plain (non-optional) `string`, so an empty
  // textarea submits as "" rather than undefined; nothing downstream
  // (leadsAdapter, the admin Leads list/detail) requires a non-empty value.
  message: z.string(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

/**
 * Public lead-capture form. Submits through useCreateLead → leadsAdapter
 * (mock today; see src/lib/api/adapters/leads-adapter.ts) — every enquiry
 * here becomes a `Lead` with source: "website", the same record shape the
 * Lead Management admin module (Part 4) will list and triage.
 */
export function ContactForm() {
  const { submit, status, error, reset } = useCreateLead();
  const { lang, t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<ContactFormValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactFormValues) => {
    const created = await submit({ ...values, source: "website" });
    if (created) resetForm();
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-success/30 bg-success/5 p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
        <h3 className="font-heading text-lg font-semibold text-ink">{t("contact.form.sentTitle")}</h3>
        <p className="text-sm text-ink-muted">{t("contact.form.sentBody")}</p>
        <Button variant="outline" size="sm" onClick={reset}>
          {t("contact.form.sendAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("contact.form.yourName")} htmlFor="name" required error={errors.name?.message}>
          <Input id="name" invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField label={t("contact.form.yourEmail")} htmlFor="email" required error={errors.email?.message}>
          <Input id="email" type="email" invalid={!!errors.email} {...register("email")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("contact.form.yourPhone")} htmlFor="phone" required error={errors.phone?.message}>
          <Input id="phone" type="tel" invalid={!!errors.phone} {...register("phone")} />
        </FormField>
        <FormField label={t("contact.form.subject")} htmlFor="subject" required error={errors.subject?.message}>
          <Select id="subject" invalid={!!errors.subject} defaultValue="" {...register("subject")}>
            <option value="" disabled>
              {t("contact.form.chooseSubject")}
            </option>
            {CONTACT_SUBJECT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {localize(lang, option, CONTACT_SUBJECT_HI)}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label={t("contact.form.messageLabel")} htmlFor="message" error={errors.message?.message}>
        <Textarea
          id="message"
          placeholder={t("contact.form.messagePlaceholder")}
          invalid={!!errors.message}
          {...register("message")}
        />
      </FormField>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={status === "loading"} className="mt-2">
        {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {t("contact.form.send")}
      </Button>
    </form>
  );
}

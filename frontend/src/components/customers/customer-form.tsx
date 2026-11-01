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
import { useCreateCustomer, useUpdateCustomer } from "@/hooks/use-customers";
import type { Customer } from "@/types/domain/customer";

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

/**
 * Create/edit form for the admin Customer Module. A customer converted from
 * a `Lead` keeps its `leadId` untouched by this form — there's no field for
 * it here, since nothing in this app lets staff re-link a customer to a
 * different lead (see `Customer.leadId`'s doc comment). Whether a Customer
 * should be creatable standalone, before any Contract/Lead exists, is
 * flagged — not owner-confirmed — in docs/OPEN_QUESTIONS.md; this form
 * supports it either way, since the new admin screens need a real
 * create/edit path regardless of how that question is eventually resolved.
 */
export function CustomerForm({
  mode,
  customer,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  customer?: Customer;
  onSuccess: (customer: Customer) => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const { submit: createCustomer, status: createStatus, error: createError } = useCreateCustomer();
  const { submit: updateCustomer, status: updateStatus, error: updateError } = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      alternatePhone: customer?.alternatePhone ?? "",
      address: customer?.address ?? "",
      notes: customer?.notes ?? "",
    },
  });

  const onSubmit = async (values: CustomerFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };
    const payload = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      alternatePhone: values.alternatePhone || undefined,
      address: values.address || undefined,
      notes: values.notes || undefined,
    };

    if (mode === "create") {
      const created = await createCustomer({ ...payload }, actor);
      if (created) onSuccess(created);
      return;
    }

    if (!customer) return;
    const updated = await updateCustomer(customer.id, payload, actor);
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full Name" htmlFor="customer-name" required error={errors.name?.message}>
          <Input id="customer-name" invalid={!!errors.name} {...register("name")} />
        </FormField>
        <FormField label="Email" htmlFor="customer-email" required error={errors.email?.message}>
          <Input id="customer-email" type="email" invalid={!!errors.email} {...register("email")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Phone" htmlFor="customer-phone" required error={errors.phone?.message}>
          <Input id="customer-phone" invalid={!!errors.phone} {...register("phone")} />
        </FormField>
        <FormField label="Alternate Phone (optional)" htmlFor="customer-alt-phone">
          <Input id="customer-alt-phone" {...register("alternatePhone")} />
        </FormField>
      </div>

      <FormField label="Address (optional)" htmlFor="customer-address">
        <Input id="customer-address" {...register("address")} />
      </FormField>

      <FormField label="Internal Notes (optional)" htmlFor="customer-notes" hint="Staff-only — never shown in the customer portal.">
        <Textarea id="customer-notes" {...register("notes")} />
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
          {mode === "create" ? "Create Customer" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

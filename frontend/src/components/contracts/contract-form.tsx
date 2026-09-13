"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { useCustomers } from "@/hooks/use-customers";
import { useCreateContract, useUpdateContract } from "@/hooks/use-contracts";
import { useProjects } from "@/hooks/use-projects";
import { ContractLineItemsEditor } from "@/components/contracts/contract-line-items-editor";
import { contractFormSchema, type ContractFormValues } from "@/components/contracts/contract-form-schema";
import type { Contract } from "@/types/domain/contract";

/**
 * Create/edit form for the admin Contract Management module. `mode: "edit"`
 * is only ever mounted for a `"draft"` or `"declined"` contract — the
 * parent page enforces that (see docs/WORKFLOWS.md's read-only rule) — so
 * this component doesn't re-check status itself.
 */
export function ContractForm({
  mode,
  contract,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  contract?: Contract;
  onSuccess: (contract: Contract) => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const { customers, status: customersStatus } = useCustomers();
  const { projects } = useProjects();
  const { submit: createContract, status: createStatus, error: createError } = useCreateContract();
  const { submit: updateContract, status: updateStatus, error: updateError } = useUpdateContract();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: contract?.title ?? "",
      customerId: contract?.customerId ?? "",
      projectId: contract?.projectId ?? "",
      notes: contract?.notes ?? "",
      lineItems: contract?.lineItems.map((li) => ({
        category: li.category,
        description: li.description,
        uom: li.uom,
        quantity: li.quantity,
        rate: li.rate,
      })) ?? [{ category: "civil", description: "", uom: "", quantity: 1, rate: 0 }],
    },
  });

  const onSubmit = async (values: ContractFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };

    if (mode === "create") {
      const created = await createContract(
        {
          title: values.title,
          customerId: values.customerId,
          projectId: values.projectId || undefined,
          notes: values.notes,
          lineItems: values.lineItems,
        },
        actor,
      );
      if (created) onSuccess(created);
      return;
    }

    if (!contract) return;
    const updated = await updateContract(
      contract.id,
      { title: values.title, notes: values.notes, lineItems: values.lineItems },
      actor,
    );
    if (updated) onSuccess(updated);
  };

  const submitting = isSubmitting || createStatus === "loading" || updateStatus === "loading";
  const submitError = mode === "create" ? createError : updateError;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Contract Title" htmlFor="contract-title" required error={errors.title?.message}>
          <Input id="contract-title" invalid={!!errors.title} {...register("title")} />
        </FormField>
        <FormField label="Customer" htmlFor="contract-customer" required error={errors.customerId?.message}>
          {customersStatus === "loading" ? (
            <LoadingSkeleton className="h-11 w-full" />
          ) : (
            <Select id="contract-customer" disabled={mode === "edit"} invalid={!!errors.customerId} {...register("customerId")}>
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </Select>
          )}
        </FormField>
      </div>

      <FormField label="Project (optional)" htmlFor="contract-project" hint="Link this contract to a project once one has been assigned.">
        <Select id="contract-project" disabled={mode === "edit"} {...register("projectId")}>
          <option value="">No project yet</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.location}
            </option>
          ))}
        </Select>
      </FormField>

      <ContractLineItemsEditor control={control} register={register} errors={errors} />

      <FormField label="Notes / Terms (optional)" htmlFor="contract-notes">
        <Textarea id="contract-notes" {...register("notes")} />
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
          {mode === "create" ? "Create Draft Contract" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

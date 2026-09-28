"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { useCustomers } from "@/hooks/use-customers";
import { useCreateContract, useUpdateContract } from "@/hooks/use-contracts";
import { useProjects } from "@/hooks/use-projects";
import { ContractLineItemsEditor } from "@/components/contracts/contract-line-items-editor";
import { contractFormSchema, type ContractFormValues } from "@/components/contracts/contract-form-schema";
import { CONTRACT_CATEGORY_TYPE_CONFIG, CONTRACT_CATEGORY_TYPE_ORDER } from "@/components/contracts/contract-category-type-config";
import { CONSTRUCTION_PACKAGES } from "@/lib/content/public-site";
import { formatBytes } from "@/lib/utils/format";
import type { Contract } from "@/types/domain/contract";

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Create/edit form for the admin Contract Management module. `mode: "edit"`
 * is only ever mounted for a `"draft"` or `"declined"` contract — the
 * parent page enforces that (see docs/WORKFLOWS.md's read-only rule) — so
 * this component doesn't re-check status itself.
 *
 * Owner corrections implemented here: city (autocomplete, #6) + state
 * (auto-filled from the picked city, still editable — feeds the new
 * contract-number format, #1), contract date (#7), contract-level category
 * with its two conditional fields (#4), and a "contract format" file
 * attachment (#3).
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: contract?.title ?? "",
      customerId: contract?.customerId ?? "",
      projectId: contract?.projectId ?? "",
      city: contract?.city ?? "",
      state: contract?.state ?? "",
      contractCategory: contract?.contractCategory ?? "ihb",
      servicesDescription: contract?.servicesDescription ?? "",
      packageCriteria: contract?.packageCriteria ?? "",
      contractDate: contract?.contractDate ?? today(),
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

  const cityValue = watch("city");
  const contractCategory = watch("contractCategory");

  const onSubmit = async (values: ContractFormValues) => {
    if (!session) return;
    const actor = { id: session.user.id, name: session.user.name };

    if (mode === "create") {
      const created = await createContract(
        {
          title: values.title,
          customerId: values.customerId,
          projectId: values.projectId || undefined,
          city: values.city,
          state: values.state,
          contractCategory: values.contractCategory,
          servicesDescription: values.contractCategory === "large_construction" ? values.servicesDescription : undefined,
          packageCriteria: values.contractCategory === "ihb" ? values.packageCriteria : undefined,
          contractDate: values.contractDate,
          notes: values.notes,
          lineItems: values.lineItems,
        },
        attachmentFile,
        actor,
      );
      if (created) onSuccess(created);
      return;
    }

    if (!contract) return;
    const updated = await updateContract(
      contract.id,
      {
        title: values.title,
        city: values.city,
        state: values.state,
        contractCategory: values.contractCategory,
        servicesDescription: values.contractCategory === "large_construction" ? values.servicesDescription : undefined,
        packageCriteria: values.contractCategory === "ihb" ? values.packageCriteria : undefined,
        contractDate: values.contractDate,
        notes: values.notes,
        lineItems: values.lineItems,
      },
      attachmentFile,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="City" htmlFor="contract-city" required error={errors.city?.message} hint="Start typing — pick from the list, or enter your own.">
          <CityAutocomplete
            id="contract-city"
            value={cityValue}
            invalid={!!errors.city}
            ariaLabel="City"
            onValueChange={(v) => setValue("city", v, { shouldValidate: true, shouldDirty: true })}
            onSelectCity={(c) => {
              setValue("city", c.city, { shouldValidate: true, shouldDirty: true });
              setValue("state", c.state, { shouldValidate: true, shouldDirty: true });
            }}
          />
        </FormField>
        <FormField label="State" htmlFor="contract-state" required error={errors.state?.message} hint="Filled in automatically when you pick a city — editable.">
          <Input id="contract-state" invalid={!!errors.state} {...register("state")} />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
        <FormField label="Date of Contract" htmlFor="contract-date" required error={errors.contractDate?.message} hint="When the contract was actually agreed — can differ from today.">
          <Input id="contract-date" type="date" max={today()} invalid={!!errors.contractDate} {...register("contractDate")} />
        </FormField>
      </div>

      <div className="rounded-card border border-border p-3">
        <FormField label="Category" htmlFor="contract-category" required error={errors.contractCategory?.message}>
          <Select id="contract-category" {...register("contractCategory")}>
            {CONTRACT_CATEGORY_TYPE_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CONTRACT_CATEGORY_TYPE_CONFIG[cat].label}
              </option>
            ))}
          </Select>
        </FormField>
        <p className="mt-1.5 text-xs text-ink-muted">{CONTRACT_CATEGORY_TYPE_CONFIG[contractCategory].hint}</p>

        {contractCategory === "large_construction" && (
          <div className="mt-3">
            <FormField
              label="Description of Services"
              htmlFor="contract-services-description"
              required
              error={errors.servicesDescription?.message}
              hint="Capture every service included in this construction contract."
            >
              <Textarea id="contract-services-description" {...register("servicesDescription")} />
            </FormField>
          </div>
        )}

        {contractCategory === "ihb" && (
          <div className="mt-3">
            <FormField label="Package Criteria" htmlFor="contract-package-criteria" required error={errors.packageCriteria?.message}>
              <Select id="contract-package-criteria" {...register("packageCriteria")}>
                <option value="">Select a package…</option>
                {CONSTRUCTION_PACKAGES.map((pkg) => (
                  <option key={pkg.slug} value={pkg.slug}>
                    {pkg.name} (₹{pkg.rateMin.toLocaleString("en-IN")}
                    {pkg.rateMax !== pkg.rateMin && `–₹${pkg.rateMax.toLocaleString("en-IN")}`}/sqft)
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        )}
      </div>

      <ContractLineItemsEditor control={control} register={register} errors={errors} />

      <FormField label="Notes / Terms (optional)" htmlFor="contract-notes">
        <Textarea id="contract-notes" {...register("notes")} />
      </FormField>

      <div>
        <Label htmlFor="contract-attachment">Contract Format (attachment, optional)</Label>
        <div className="mt-1.5 flex items-center gap-3">
          <Input
            id="contract-attachment"
            type="file"
            onChange={(e) => setAttachmentFile(e.target.files?.[0] ?? null)}
            className="h-auto py-2"
          />
        </div>
        {contract?.attachment && !attachmentFile && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
            <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Currently attached: {contract.attachment.fileName} ({formatBytes(contract.attachment.fileSizeBytes)}) — choose a new file to replace it.
          </p>
        )}
        <p className="mt-1 text-xs text-ink-muted">
          Attach the signed/shared contract format document with this contract. File storage is mock-only in this
          build (kept for this browser session) — see docs/OPEN_QUESTIONS.md #8.
        </p>
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
          {mode === "create" ? "Create Draft Contract" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

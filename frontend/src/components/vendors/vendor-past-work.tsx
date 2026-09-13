"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Briefcase, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/domain/empty-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useAddVendorPastWork } from "@/hooks/use-vendors";
import { formatDate, formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { VendorPastWorkEntry } from "@/types/domain/vendor";

const pastWorkFormSchema = z.object({
  projectId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  value: z.coerce.number().min(0, "Value cannot be negative"),
  completedAt: z.string().min(1, "Completion date is required"),
});

type PastWorkFormValues = z.infer<typeof pastWorkFormSchema>;

/**
 * Required "past work section" ("past BrickBasket work experience/value").
 * FRONTEND IMPLEMENTATION DECISION on the data model — see
 * `src/types/domain/vendor.ts`'s header comment on `VendorPastWorkEntry`
 * and docs/OPEN_QUESTIONS.md #28.
 */
export function VendorPastWork({ vendorId, entries, onAdded }: { vendorId: string; entries: VendorPastWorkEntry[]; onAdded: () => void }) {
  const { session } = useSession();
  const { projects: allProjects } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const { submit: addPastWork, status, error } = useAddVendorPastWork();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PastWorkFormValues>({
    resolver: zodResolver(pastWorkFormSchema),
    defaultValues: { projectId: "", description: "", value: 0, completedAt: "" },
  });

  const onSubmit = async (values: PastWorkFormValues) => {
    if (!session) return;
    const created = await addPastWork(
      vendorId,
      {
        projectId: values.projectId || undefined,
        description: values.description,
        value: values.value,
        completedAt: new Date(values.completedAt).toISOString(),
      },
      { id: session.user.id, name: session.user.name },
    );
    if (created) {
      reset();
      setShowForm(false);
      onAdded();
    }
  };

  const submitting = isSubmitting || status === "loading";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-ink">Past Work</p>
        <PermissionGuard permission="vendors:write">
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Entry
          </Button>
        </PermissionGuard>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-card border border-border bg-surface-muted p-4" noValidate>
          <FormField label="Project (optional)" htmlFor="pastwork-project">
            <Select id="pastwork-project" {...register("projectId")}>
              <option value="">Not linked to a project</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Description" htmlFor="pastwork-description" required error={errors.description?.message}>
            <Input id="pastwork-description" invalid={!!errors.description} {...register("description")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Value (₹)" htmlFor="pastwork-value" required error={errors.value?.message}>
              <Input id="pastwork-value" type="number" min={0} invalid={!!errors.value} {...register("value")} />
            </FormField>
            <FormField label="Completed On" htmlFor="pastwork-completed" required error={errors.completedAt?.message}>
              <Input id="pastwork-completed" type="date" invalid={!!errors.completedAt} {...register("completedAt")} />
            </FormField>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Add
            </Button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <EmptyState icon={Briefcase} title="No past work on file" description="Completed work for this vendor will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const project = entry.projectId ? allProjects.find((p) => p.id === entry.projectId) : null;
            return (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface p-3 text-sm">
                <div>
                  <p className="text-ink">{entry.description}</p>
                  <p className="text-xs text-ink-muted">
                    {project ? `${project.name} · ` : ""}Completed {formatDate(entry.completedAt)}
                  </p>
                </div>
                <p className="font-medium text-ink">{formatINR(entry.value)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

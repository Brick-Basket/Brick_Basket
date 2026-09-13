"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/domain/empty-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { useRequisitions } from "@/hooks/use-requisitions";
import { useRFQs, useCreateRFQ } from "@/hooks/use-rfq";
import { useProjects } from "@/hooks/use-projects";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

const createFormSchema = z.object({
  requisitionId: z.string().min(1, "Select a requisition"),
  taxPercent: z.coerce.number().min(0, "Tax can't be negative").max(100, "Tax can't exceed 100%"),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

/**
 * Creates an RFQ from an approved requisition — "Requisition flows to
 * admin/purchaser." Reads `?requisitionId=` (set when arriving from the
 * Requisition detail page's "Create RFQ" link) to pre-select and lock the
 * requisition picker. Owns its own navigation, so it can be dropped
 * straight into the `/new` page's Suspense boundary without prop plumbing.
 */
export function RFQCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRequisitionId = searchParams.get("requisitionId") ?? undefined;

  const { session } = useSession();
  const { projects: allProjects } = useProjects();
  const { status: requisitionsStatus, result: requisitionsResult } = useRequisitions({
    status: "approved",
    pageSize: 100,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const { status: rfqsStatus, result: rfqsResult } = useRFQs({ pageSize: 200 });
  const { submit: createRFQ, status: createStatus, error: createError } = useCreateRFQ();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { requisitionId: initialRequisitionId ?? "", taxPercent: 18 },
  });

  if (requisitionsStatus === "loading" || rfqsStatus === "loading") {
    return <LoadingSkeleton className="h-64 w-full" />;
  }

  const usedRequisitionIds = new Set((rfqsResult?.items ?? []).map((r) => r.requisitionId));
  const availableRequisitions = (requisitionsResult?.items ?? []).filter((r) => !usedRequisitionIds.has(r.id));

  if (availableRequisitions.length === 0 && !initialRequisitionId) {
    return (
      <EmptyState
        title="No approved requisitions are ready for RFQ"
        description="An RFQ can only be created from a requisition that's been approved and doesn't already have one — see Purchase / Material Requisition."
        action={
          <Button variant="outline" onClick={() => router.push(ADMIN_ROUTES.requisitions)}>
            View Requisitions
          </Button>
        }
      />
    );
  }

  const onSubmit = async (values: CreateFormValues) => {
    if (!session) return;
    const created = await createRFQ({ requisitionId: values.requisitionId, taxPercent: values.taxPercent }, { id: session.user.id, name: session.user.name });
    if (created) router.push(`${ADMIN_ROUTES.rfqs}/${created.id}`);
  };

  const submitting = isSubmitting || createStatus === "loading";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField
        label="Approved Requisition"
        htmlFor="rfq-requisition"
        required
        error={errors.requisitionId?.message}
        hint={initialRequisitionId ? "Pre-selected from the requisition you came from." : undefined}
      >
        <Select id="rfq-requisition" disabled={!!initialRequisitionId} invalid={!!errors.requisitionId} {...register("requisitionId")}>
          <option value="">Select a requisition…</option>
          {availableRequisitions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.requisitionNumber} — {allProjects.find((p) => p.id === r.projectId)?.name ?? "Unknown project"}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Applicable Tax (%)"
        htmlFor="rfq-tax"
        required
        error={errors.taxPercent?.message}
        hint="E.g. GST — applied to every line's computed total. Editable later while the RFQ is still in comparison."
      >
        <Input id="rfq-tax" type="number" step="any" invalid={!!errors.taxPercent} {...register("taxPercent")} />
      </FormField>

      {createError && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {createError}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(ADMIN_ROUTES.rfqs)} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Create RFQ
        </Button>
      </div>
    </form>
  );
}

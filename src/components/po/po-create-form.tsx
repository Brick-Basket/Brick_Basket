"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { useRFQ } from "@/hooks/use-rfq";
import { usePurchaseOrders, useCreatePurchaseOrder } from "@/hooks/use-purchase-orders";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import { useVendors } from "@/hooks/use-vendors";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

const createFormSchema = z.object({
  termsAndConditions: z.string().max(2000, "Keep terms under 2000 characters").optional(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

/**
 * Creates a Purchase Order from one vendor's selected lines on a finalized
 * RFQ — "Purchaser selects finalized/L1 vendor. Generate PO with terms &
 * conditions." Reads `?rfqId=` and `?vendorId=` (set by the RFQ detail
 * page's per-vendor-group "Create PO" link — see `rfq-detail.tsx`) to know
 * which vendor group this PO covers. Owns its own navigation, so it can be
 * dropped straight into the `/new` page's Suspense boundary without prop
 * plumbing, same pattern as `RFQCreateForm` (Part 9).
 */
export function POCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rfqId = searchParams.get("rfqId");
  const vendorId = searchParams.get("vendorId");

  const { session } = useSession();
  const { status: rfqStatus, rfq, lines, quotes } = useRFQ(rfqId);
  const { status: posStatus, result: posResult } = usePurchaseOrders({ rfqId: rfqId ?? "__none__", pageSize: 50 });
  const { submit: createPO, status: createStatus, error: createError } = useCreatePurchaseOrder();
  const { projects: allProjects } = useProjects();
  const { result: vendorsResult } = useVendors({});
  const allVendors = vendorsResult?.items ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { termsAndConditions: "" },
  });

  if (!rfqId || !vendorId) {
    return (
      <EmptyState
        title="Choose a vendor group from a finalized RFQ"
        description="A Purchase Order is created from one vendor's selected lines on a finalized RFQ — start from that RFQ's detail page and use its 'Create PO' link."
        action={
          <Button variant="outline" onClick={() => router.push(ADMIN_ROUTES.rfqs)}>
            View RFQs
          </Button>
        }
      />
    );
  }

  if (rfqStatus === "loading" || posStatus === "loading") {
    return <LoadingSkeleton className="h-64 w-full" />;
  }

  if (rfqStatus === "error" || !rfq) {
    return <ErrorState title="Could not load that RFQ" />;
  }

  if (rfq.status !== "finalized") {
    return <ErrorState title="This RFQ isn't ready for a Purchase Order" description="Only a finalized RFQ can be used to create a Purchase Order." />;
  }

  const vendorLines = lines.filter((l) => l.selectedVendorId === vendorId);
  const alreadyHasPO = (posResult?.items ?? []).some((po) => po.vendorId === vendorId);

  if (vendorLines.length === 0 || alreadyHasPO) {
    return (
      <EmptyState
        title={alreadyHasPO ? "This vendor already has a Purchase Order" : "This vendor has no selected lines on this RFQ"}
        description="Go back to the RFQ to pick a different vendor group."
        action={
          <Button variant="outline" onClick={() => router.push(`${ADMIN_ROUTES.rfqs}/${rfqId}`)}>
            Back to RFQ
          </Button>
        }
      />
    );
  }

  const vendor = allVendors.find((v) => v.id === vendorId);
  const project = allProjects.find((p) => p.id === rfq.projectId);
  const previewTotal = vendorLines.reduce((sum, line) => {
    const quote = quotes.find((q) => q.rfqLineId === line.id && q.vendorId === vendorId);
    const amount = (quote?.rate ?? 0) * line.quantity;
    return sum + amount + amount * (rfq.taxPercent / 100);
  }, 0);

  const onSubmit = async (values: CreateFormValues) => {
    if (!session) return;
    const created = await createPO(
      { rfqId, vendorId, termsAndConditions: values.termsAndConditions },
      { id: session.user.id, name: session.user.name },
    );
    if (created) router.push(`${ADMIN_ROUTES.purchaseOrders}/${created.id}`);
  };

  const submitting = isSubmitting || createStatus === "loading";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="rounded-card border border-border bg-surface-muted p-4 text-sm">
        <p className="text-ink-muted">Project</p>
        <p className="font-medium text-ink">{project?.name ?? "—"}</p>
        <p className="mt-2 text-ink-muted">Vendor</p>
        <p className="font-medium text-ink">
          {vendor?.tradeName ?? "Unknown vendor"} <span className="text-ink-muted">· Code {vendor?.vendorCode ?? "—"}</span>
        </p>
        <p className="mt-2 text-ink-muted">
          Lines ({vendorLines.length}) · Applicable Tax {rfq.taxPercent}%
        </p>
        <ul className="mt-1 list-inside list-disc text-ink">
          {vendorLines.map((l) => (
            <li key={l.id}>
              {l.description} — {l.quantity.toLocaleString("en-IN")} {l.uom}
            </li>
          ))}
        </ul>
        <p className="mt-2 font-semibold text-ink">Estimated Total: {formatINR(previewTotal)}</p>
      </div>

      <FormField
        label="Terms & Conditions"
        htmlFor="po-terms"
        error={errors.termsAndConditions?.message}
        hint="Payment terms, delivery expectations, etc. — editable later while this PO is still draft or rejected."
      >
        <Textarea id="po-terms" rows={5} {...register("termsAndConditions")} />
      </FormField>

      {createError && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {createError}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push(`${ADMIN_ROUTES.rfqs}/${rfqId}`)} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Create Purchase Order
        </Button>
      </div>
    </form>
  );
}

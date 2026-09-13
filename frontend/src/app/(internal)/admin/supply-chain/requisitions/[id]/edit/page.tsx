"use client";

import { useRouter, useParams } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useRequisition } from "@/hooks/use-requisitions";
import { RequisitionForm } from "@/components/requisitions/requisition-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function EditRequisitionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requisitionId = params.id;
  const { status, requisition, lines, error, refetch } = useRequisition(requisitionId);

  return (
    <PermissionGuard
      permission="requisitions:create"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to edit requisitions" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Edit Requisition</h1>
          <p className="text-sm text-ink-muted">
            Editable while this requisition is a draft or has been rejected — submit it again once you&apos;re done.
          </p>
        </div>

        {status === "loading" && <LoadingSkeleton className="h-96 w-full" />}
        {status === "error" && <ErrorState title="Could not load this requisition" description={error ?? undefined} onRetry={refetch} />}
        {status === "success" && !requisition && <ErrorState title="Requisition not found" />}
        {status === "success" && requisition && requisition.status !== "draft" && requisition.status !== "rejected" && (
          <ErrorState
            variant="forbidden"
            title="This requisition can no longer be edited"
            description="Only draft or rejected requisitions can be edited."
          />
        )}
        {status === "success" && requisition && (requisition.status === "draft" || requisition.status === "rejected") && (
          <RequisitionForm
            mode="edit"
            requisition={requisition}
            existingLines={lines}
            onCancel={() => router.push(`${ADMIN_ROUTES.requisitions}/${requisitionId}`)}
            onSuccess={() => router.push(`${ADMIN_ROUTES.requisitions}/${requisitionId}`)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

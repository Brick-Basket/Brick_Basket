"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { RequisitionForm } from "@/components/requisitions/requisition-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function NewRequisitionPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permission="requisitions:create"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create requisitions" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New Requisition</h1>
          <p className="text-sm text-ink-muted">Starts as a draft — nothing goes to review until you submit it.</p>
        </div>
        <RequisitionForm
          mode="create"
          onCancel={() => router.push(ADMIN_ROUTES.requisitions)}
          onSuccess={(requisition) => router.push(`${ADMIN_ROUTES.requisitions}/${requisition.id}`)}
        />
      </div>
    </PermissionGuard>
  );
}

"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { RequisitionDetail } from "@/components/requisitions/requisition-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminRequisitionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requisitionId = params.id;

  return (
    <PermissionGuard
      permission="requisitions:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Purchase / Material Requisitions" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.requisitions)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Requisitions
        </Button>
        <RequisitionDetail requisitionId={requisitionId} onEdit={() => router.push(`${ADMIN_ROUTES.requisitions}/${requisitionId}/edit`)} />
      </div>
    </PermissionGuard>
  );
}

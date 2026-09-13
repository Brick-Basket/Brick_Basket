"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { StoreRequisitionDetail } from "@/components/store-requisitions/store-requisition-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminStoreRequisitionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requisitionId = params.id;

  return (
    <PermissionGuard
      permission="store_requisitions:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Material Requisitions" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.storeRequisitions)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Material Requisitions
        </Button>
        <StoreRequisitionDetail requisitionId={requisitionId} />
      </div>
    </PermissionGuard>
  );
}

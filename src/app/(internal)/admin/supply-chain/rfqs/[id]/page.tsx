"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { RFQDetail } from "@/components/rfq/rfq-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminRFQDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rfqId = params.id;

  return (
    <PermissionGuard
      permission="rfq:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to RFQ Management" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.rfqs)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to RFQs
        </Button>
        <RFQDetail
          rfqId={rfqId}
          onOpenRequisition={(requisitionId) => router.push(`${ADMIN_ROUTES.requisitions}/${requisitionId}`)}
          onOpenPurchaseOrder={(purchaseOrderId) => router.push(`${ADMIN_ROUTES.purchaseOrders}/${purchaseOrderId}`)}
        />
      </div>
    </PermissionGuard>
  );
}

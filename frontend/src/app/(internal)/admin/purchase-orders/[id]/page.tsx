"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { PODetail } from "@/components/po/po-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminPurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const purchaseOrderId = params.id;

  return (
    <PermissionGuard
      permission="po:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Purchase Orders" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.purchaseOrders)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Purchase Orders
        </Button>
        <PODetail
          purchaseOrderId={purchaseOrderId}
          onOpenRFQ={(rfqId) => router.push(`${ADMIN_ROUTES.rfqs}/${rfqId}`)}
          onOpenGRN={(grnId) => router.push(`${ADMIN_ROUTES.grn}/${grnId}`)}
        />
      </div>
    </PermissionGuard>
  );
}

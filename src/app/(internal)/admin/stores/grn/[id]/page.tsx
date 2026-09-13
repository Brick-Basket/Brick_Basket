"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { GRNDetail } from "@/components/grn/grn-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminGRNDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const grnId = params.id;

  return (
    <PermissionGuard
      permission="grn:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Goods Receipt Notes" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.grn)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to GRN
        </Button>
        <GRNDetail grnId={grnId} onOpenPurchaseOrder={(purchaseOrderId) => router.push(`${ADMIN_ROUTES.purchaseOrders}/${purchaseOrderId}`)} />
      </div>
    </PermissionGuard>
  );
}

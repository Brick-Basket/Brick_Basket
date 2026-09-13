"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCustomers } from "@/hooks/use-customers";
import { useMRC } from "@/hooks/use-mrc";
import { MRCDetail } from "@/components/mrc/mrc-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminMRCDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const mrcId = params.id;

  return (
    <PermissionGuard
      permission="mrc:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Material Receipt Certificates" />
        </div>
      }
    >
      <AdminMRCDetailContent mrcId={mrcId} onBack={() => router.push(ADMIN_ROUTES.mrc)} />
    </PermissionGuard>
  );
}

function AdminMRCDetailContent({ mrcId, onBack }: { mrcId: string; onBack: () => void }) {
  const router = useRouter();
  const { mrc } = useMRC(mrcId);
  const { customers, status: customersStatus } = useCustomers();
  const customer = customers.find((c) => c.id === mrc?.customerId) ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" className="w-fit" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to MRCs
      </Button>
      {customersStatus === "loading" ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : (
        <MRCDetail
          mrcId={mrcId}
          perspective="admin"
          customer={customer}
          onEdit={() => router.push(`${ADMIN_ROUTES.mrc}/${mrcId}/edit`)}
        />
      )}
    </div>
  );
}

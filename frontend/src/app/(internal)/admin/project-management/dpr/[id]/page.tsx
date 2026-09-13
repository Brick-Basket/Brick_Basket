"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { DPRDetail } from "@/components/dpr/dpr-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminDPRDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const dprId = params.id;

  return (
    <PermissionGuard
      permission="dpr:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Daily Progress Reports" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.dpr)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to DPRs
        </Button>
        <DPRDetail dprId={dprId} onEdit={() => router.push(`${ADMIN_ROUTES.dpr}/${dprId}/edit`)} />
      </div>
    </PermissionGuard>
  );
}

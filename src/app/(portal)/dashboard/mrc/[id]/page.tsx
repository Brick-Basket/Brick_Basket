"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { MRCDetail } from "@/components/mrc/mrc-detail";
import { PORTAL_ROUTES } from "@/lib/constants/routes";

export default function MyMRCDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  return (
    <PermissionGuard
      permission="mrc:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Material Receipt Certificates" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(PORTAL_ROUTES.mrc)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to My MRCs
        </Button>
        <MRCDetail mrcId={params.id} perspective="customer" />
      </div>
    </PermissionGuard>
  );
}

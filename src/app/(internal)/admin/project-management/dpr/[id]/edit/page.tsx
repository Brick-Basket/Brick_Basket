"use client";

import { useRouter, useParams } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useDPR } from "@/hooks/use-dpr";
import { DPRForm } from "@/components/dpr/dpr-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function EditDPRPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const dprId = params.id;
  const { status, dpr, manpower, workItems, error, refetch } = useDPR(dprId);

  return (
    <PermissionGuard
      permission="dpr:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to edit Daily Progress Reports" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Edit Daily Progress Report</h1>
          <p className="text-sm text-ink-muted">The project is fixed once a DPR is created — everything else can be revised.</p>
        </div>

        {status === "loading" && <LoadingSkeleton className="h-96 w-full" />}
        {status === "error" && <ErrorState title="Could not load this DPR" description={error ?? undefined} onRetry={refetch} />}
        {status === "success" && !dpr && <ErrorState title="DPR not found" />}
        {status === "success" && dpr && (
          <DPRForm
            mode="edit"
            dpr={dpr}
            initialManpower={manpower}
            initialWorkItems={workItems}
            onCancel={() => router.push(`${ADMIN_ROUTES.dpr}/${dprId}`)}
            onSuccess={() => router.push(`${ADMIN_ROUTES.dpr}/${dprId}`)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

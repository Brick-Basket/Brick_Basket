"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { DPRForm } from "@/components/dpr/dpr-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function NewDPRPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permission="dpr:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create Daily Progress Reports" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New Daily Progress Report</h1>
          <p className="text-sm text-ink-muted">Log today&apos;s manpower and work-item quantities for a project.</p>
        </div>
        <DPRForm
          mode="create"
          onCancel={() => router.push(ADMIN_ROUTES.dpr)}
          onSuccess={(dpr) => router.push(`${ADMIN_ROUTES.dpr}/${dpr.id}`)}
        />
      </div>
    </PermissionGuard>
  );
}

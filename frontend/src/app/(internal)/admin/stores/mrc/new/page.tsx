"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { MRCForm } from "@/components/mrc/mrc-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function NewMRCPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permission="mrc:issue"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create MRCs" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New Material Receipt Certificate</h1>
          <p className="text-sm text-ink-muted">Starts as a draft — nothing is shown to the customer until you issue it.</p>
        </div>
        <MRCForm
          mode="create"
          onCancel={() => router.push(ADMIN_ROUTES.mrc)}
          onSuccess={(mrc) => router.push(`${ADMIN_ROUTES.mrc}/${mrc.id}`)}
        />
      </div>
    </PermissionGuard>
  );
}

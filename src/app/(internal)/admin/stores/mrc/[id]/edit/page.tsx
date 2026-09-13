"use client";

import { useRouter, useParams } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useMRC } from "@/hooks/use-mrc";
import { MRCForm } from "@/components/mrc/mrc-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { CreateMRCLineInput } from "@/types/domain/mrc";

export default function EditMRCPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const mrcId = params.id;
  const { status, mrc, lineItems, error, refetch } = useMRC(mrcId);

  const initialLines: CreateMRCLineInput[] = lineItems.map((l) =>
    l.source === "grn"
      ? { source: "grn", grnLineItemId: l.grnLineItemId!, quantity: l.quantity, warrantyTerms: l.warrantyTerms }
      : { source: "manual", description: l.description, uom: l.uom, quantity: l.quantity, make: l.make, warrantyTerms: l.warrantyTerms },
  );

  return (
    <PermissionGuard
      permission="mrc:issue"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to edit MRCs" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Edit Material Receipt Certificate</h1>
          <p className="text-sm text-ink-muted">
            Editable while this MRC is a draft or has been declined — issue it again once you&apos;re done.
          </p>
        </div>

        {status === "loading" && <LoadingSkeleton className="h-96 w-full" />}
        {status === "error" && <ErrorState title="Could not load this MRC" description={error ?? undefined} onRetry={refetch} />}
        {status === "success" && !mrc && <ErrorState title="MRC not found" />}
        {status === "success" && mrc && mrc.status !== "draft" && mrc.status !== "declined" && (
          <ErrorState
            variant="forbidden"
            title="This MRC can no longer be edited"
            description="Only draft or declined certificates can be edited. Withdraw it to draft first if it's out for acceptance."
          />
        )}
        {status === "success" && mrc && (mrc.status === "draft" || mrc.status === "declined") && (
          <MRCForm
            mode="edit"
            mrc={mrc}
            initialLines={initialLines}
            onCancel={() => router.push(`${ADMIN_ROUTES.mrc}/${mrcId}`)}
            onSuccess={() => router.push(`${ADMIN_ROUTES.mrc}/${mrcId}`)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

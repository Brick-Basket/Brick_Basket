"use client";

import { useRouter, useParams } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useVendor } from "@/hooks/use-vendors";
import { VendorForm } from "@/components/vendors/vendor-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const vendorId = params.id;
  const { status, vendor, error, refetch } = useVendor(vendorId);

  return (
    <PermissionGuard
      permission="vendors:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to edit vendors" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Edit Vendor</h1>
          <p className="text-sm text-ink-muted">The vendor code series can&apos;t be changed once a vendor is created.</p>
        </div>

        {status === "loading" && <LoadingSkeleton className="h-96 w-full" />}
        {status === "error" && <ErrorState title="Could not load this vendor" description={error ?? undefined} onRetry={refetch} />}
        {status === "success" && !vendor && <ErrorState title="Vendor not found" />}
        {status === "success" && vendor && (
          <VendorForm
            mode="edit"
            vendor={vendor}
            onCancel={() => router.push(`${ADMIN_ROUTES.vendors}/${vendorId}`)}
            onSuccess={() => router.push(`${ADMIN_ROUTES.vendors}/${vendorId}`)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

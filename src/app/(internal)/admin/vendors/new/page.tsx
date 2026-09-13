"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { VendorForm } from "@/components/vendors/vendor-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function NewVendorPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permission="vendors:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create vendors" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New Vendor</h1>
          <p className="text-sm text-ink-muted">A vendor code is assigned automatically from the selected series once created.</p>
        </div>
        <VendorForm
          mode="create"
          onCancel={() => router.push(ADMIN_ROUTES.vendors)}
          onSuccess={(vendor) => router.push(`${ADMIN_ROUTES.vendors}/${vendor.id}`)}
        />
      </div>
    </PermissionGuard>
  );
}

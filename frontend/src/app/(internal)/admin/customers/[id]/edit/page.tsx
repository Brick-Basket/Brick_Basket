"use client";

import { useRouter, useParams } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCustomer } from "@/hooks/use-customers";
import { CustomerForm } from "@/components/customers/customer-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const { status, customer, error, refetch } = useCustomer(customerId);

  return (
    <PermissionGuard
      permission="customers:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to edit customers" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Edit Customer</h1>
        </div>

        {status === "loading" && <LoadingSkeleton className="h-96 w-full" />}
        {status === "error" && <ErrorState title="Could not load this customer" description={error ?? undefined} onRetry={refetch} />}
        {status === "success" && !customer && <ErrorState title="Customer not found" />}
        {status === "success" && customer && (
          <CustomerForm
            mode="edit"
            customer={customer}
            onCancel={() => router.push(`${ADMIN_ROUTES.customers}/${customerId}`)}
            onSuccess={() => router.push(`${ADMIN_ROUTES.customers}/${customerId}`)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

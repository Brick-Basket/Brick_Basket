"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { CustomerForm } from "@/components/customers/customer-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function NewCustomerPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permission="customers:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create customers" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New Customer</h1>
          <p className="text-sm text-ink-muted">Create a customer profile directly, without first converting a lead.</p>
        </div>
        <CustomerForm
          mode="create"
          onCancel={() => router.push(ADMIN_ROUTES.customers)}
          onSuccess={(customer) => router.push(`${ADMIN_ROUTES.customers}/${customer.id}`)}
        />
      </div>
    </PermissionGuard>
  );
}

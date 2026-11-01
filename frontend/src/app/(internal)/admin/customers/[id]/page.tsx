"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { CustomerDetail } from "@/components/customers/customer-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminCustomerDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  return (
    <PermissionGuard
      permission="customers:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to the Customer Module" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.customers)}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Customers
        </Button>
        <CustomerDetail customerId={customerId} onEdit={() => router.push(`${ADMIN_ROUTES.customers}/${customerId}/edit`)} />
      </div>
    </PermissionGuard>
  );
}

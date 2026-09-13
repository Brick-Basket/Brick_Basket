"use client";

import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { ContractForm } from "@/components/contracts/contract-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function NewContractPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permission="contracts:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create contracts" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New Contract</h1>
          <p className="text-sm text-ink-muted">Starts as a draft — nothing is sent to the customer until you choose to.</p>
        </div>
        <ContractForm
          mode="create"
          onCancel={() => router.push(ADMIN_ROUTES.contracts)}
          onSuccess={(contract) => router.push(`${ADMIN_ROUTES.contracts}/${contract.id}`)}
        />
      </div>
    </PermissionGuard>
  );
}

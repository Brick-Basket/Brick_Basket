"use client";

import { useRouter, useParams } from "next/navigation";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useContract } from "@/hooks/use-contracts";
import { ContractForm } from "@/components/contracts/contract-form";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const contractId = params.id;
  const { status, contract, error, refetch } = useContract(contractId);

  return (
    <PermissionGuard
      permission="contracts:write"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to edit contracts" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Edit Contract</h1>
          <p className="text-sm text-ink-muted">
            Editable while this contract is a draft or has been declined — send it again once you&apos;re done.
          </p>
        </div>

        {status === "loading" && <LoadingSkeleton className="h-96 w-full" />}
        {status === "error" && <ErrorState title="Could not load this contract" description={error ?? undefined} onRetry={refetch} />}
        {status === "success" && !contract && <ErrorState title="Contract not found" />}
        {status === "success" && contract && contract.status !== "draft" && contract.status !== "declined" && (
          <ErrorState
            variant="forbidden"
            title="This contract can no longer be edited"
            description="Only draft or declined contracts can be edited. Withdraw it to draft first if it's out for acceptance."
          />
        )}
        {status === "success" && contract && (contract.status === "draft" || contract.status === "declined") && (
          <ContractForm
            mode="edit"
            contract={contract}
            onCancel={() => router.push(`${ADMIN_ROUTES.contracts}/${contractId}`)}
            onSuccess={() => router.push(`${ADMIN_ROUTES.contracts}/${contractId}`)}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

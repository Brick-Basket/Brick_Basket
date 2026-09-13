"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCustomers } from "@/hooks/use-customers";
import { useContract } from "@/hooks/use-contracts";
import { ContractDetail } from "@/components/contracts/contract-detail";
import { ADMIN_ROUTES } from "@/lib/constants/routes";

export default function AdminContractDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const contractId = params.id;

  return (
    <PermissionGuard
      permission="contracts:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Contract Management" />
        </div>
      }
    >
      <AdminContractDetailContent contractId={contractId} onBack={() => router.push(ADMIN_ROUTES.contracts)} />
    </PermissionGuard>
  );
}

function AdminContractDetailContent({ contractId, onBack }: { contractId: string; onBack: () => void }) {
  const router = useRouter();
  const { contract } = useContract(contractId);
  const { customers, status: customersStatus } = useCustomers();
  const customer = customers.find((c) => c.id === contract?.customerId) ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" className="w-fit" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Contracts
      </Button>
      {customersStatus === "loading" ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : (
        <ContractDetail
          contractId={contractId}
          perspective="admin"
          customer={customer}
          onEdit={() => router.push(`${ADMIN_ROUTES.contracts}/${contractId}/edit`)}
        />
      )}
    </div>
  );
}

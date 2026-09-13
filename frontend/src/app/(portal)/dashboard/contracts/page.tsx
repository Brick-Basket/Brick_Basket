"use client";

import { useRouter } from "next/navigation";
import { FileSignature } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { StatusBadge } from "@/components/domain/status-badge";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCustomerId } from "@/hooks/use-customer-id";
import { useContracts } from "@/hooks/use-contracts";
import { CONTRACT_STATUS_CONFIG } from "@/components/contracts/contract-status-config";
import { formatDate, formatINR } from "@/lib/utils/format";
import { PORTAL_ROUTES } from "@/lib/constants/routes";

export default function MyContractsPage() {
  return (
    <PermissionGuard
      permission="contracts:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Contracts" />
        </div>
      }
    >
      <MyContractsContent />
    </PermissionGuard>
  );
}

function MyContractsContent() {
  const router = useRouter();
  // See `useCustomerId` — an unguarded `session?.user.id` would list every
  // customer's contracts, not just this one's, while the session is still
  // resolving. See docs/OPEN_QUESTIONS.md #47.
  const customerId = useCustomerId();
  const { status, error, result, refetch } = useContracts({
    customerId,
    pageSize: 50,
    sortBy: "updatedAt",
    sortDir: "desc",
  });

  // Drafts are never sent to the customer yet — filtered client-side as a
  // frontend safeguard; the real backend's customer-facing endpoint must
  // never return draft contracts in the first place. See docs/WORKFLOWS.md.
  const visibleContracts = (result?.items ?? []).filter((c) => c.status !== "draft");

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">My Contracts</h1>
        <p className="text-sm text-ink-muted">Review and respond to contracts BrickBasket has sent you.</p>
      </div>

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-28 w-full" />
          <LoadingSkeleton className="h-28 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load your contracts" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && visibleContracts.length === 0 && (
        <EmptyState
          icon={FileSignature}
          title="No contracts yet"
          description="Contracts BrickBasket sends you for review will appear here."
        />
      )}

      {status === "success" && visibleContracts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleContracts.map((contract) => {
            const total = contract.lineItems.reduce((sum, li) => sum + li.quantity * li.rate, 0);
            return (
              <Card
                key={contract.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`${PORTAL_ROUTES.contracts}/${contract.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{contract.title}</CardTitle>
                    <StatusBadge status={contract.status} config={CONTRACT_STATUS_CONFIG} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm text-ink-muted">
                  <p>{contract.contractNumber}</p>
                  <p>{formatINR(total)}</p>
                  <p>Updated {formatDate(contract.updatedAt)}</p>
                  {contract.status === "sent_for_acceptance" && (
                    <p className="mt-1 font-medium text-brand-red">Awaiting your response</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

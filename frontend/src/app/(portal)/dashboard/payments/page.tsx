"use client";

import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCustomerId } from "@/hooks/use-customer-id";
import { usePayments } from "@/hooks/use-payments";
import { PaymentTable } from "@/components/payments/payment-table";
import { formatINR } from "@/lib/utils/format";

/**
 * Read-only "Payment status/history" view for customers (§8B/§8C don't
 * name this view explicitly, but `docs/PART_PROMPTS.md`'s Part 16
 * blockquote and the `finance:read`-only `customer` permission assigned
 * in Part 3 both anticipate it). Scoped to the signed-in customer's own
 * receipts (`direction: "receipt"`) — never editable here, matching
 * every other customer-portal list's read-only framing.
 */
export default function MyPaymentsPage() {
  return (
    <PermissionGuard
      permission="finance:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Payments" />
        </div>
      }
    >
      <MyPaymentsContent />
    </PermissionGuard>
  );
}

function MyPaymentsContent() {
  // See `useCustomerId` — an unguarded `session?.user.id` would list every
  // customer's payments, not just this one's, while the session is still
  // resolving. See docs/OPEN_QUESTIONS.md #47.
  const customerId = useCustomerId();
  const { status, error, result, refetch } = usePayments({
    direction: "receipt",
    customerId,
    pageSize: 50,
    sortBy: "paymentDate",
    sortDir: "desc",
  });

  const receipts = result?.items ?? [];
  const totalReceived = receipts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Payments</h1>
        <p className="text-sm text-ink-muted">Receipts BrickBasket has recorded against your contracts.</p>
      </div>

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-20 w-full" />
          <LoadingSkeleton className="h-40 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load your payments" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && receipts.length === 0 && (
        <EmptyState icon={Wallet} title="No payments recorded yet" description="Receipts BrickBasket records against your contracts will appear here." />
      )}

      {status === "success" && receipts.length > 0 && (
        <>
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Received</p>
            <p className="mt-1 font-heading text-xl font-semibold text-ink">{formatINR(totalReceived)}</p>
          </Card>
          <PaymentTable payments={receipts} onSortChange={() => {}} />
        </>
      )}
    </div>
  );
}

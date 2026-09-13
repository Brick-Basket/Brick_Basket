import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { POCreateForm } from "@/components/po/po-create-form";

/**
 * Server-component wrapper so `POCreateForm`'s query-string read (the
 * `rfqId`/`vendorId` params) sits inside a Suspense boundary, same pattern
 * as `/login` and `/admin/supply-chain/rfqs/new` (Part 9).
 */
export default function NewPurchaseOrderPage() {
  return (
    <PermissionGuard
      permission="po:create"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create a Purchase Order" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New Purchase Order</h1>
          <p className="text-sm text-ink-muted">Generate a PO for one vendor&rsquo;s selected lines on a finalized RFQ, with terms &amp; conditions.</p>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden />
            </div>
          }
        >
          <POCreateForm />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}

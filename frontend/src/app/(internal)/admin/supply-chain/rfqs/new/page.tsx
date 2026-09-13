import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { RFQCreateForm } from "@/components/rfq/rfq-create-form";

/**
 * Server-component wrapper so `RFQCreateForm`'s query-string read (the
 * `requisitionId` param) sits inside a Suspense boundary, same pattern as
 * `/login`'s `LoginForm`.
 */
export default function NewRFQPage() {
  return (
    <PermissionGuard
      permission="rfq:compare"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to create an RFQ" />
        </div>
      }
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 md:p-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">New RFQ</h1>
          <p className="text-sm text-ink-muted">Create an RFQ from an approved requisition, then collect vendor quotes for comparison.</p>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-brand-red" aria-hidden />
            </div>
          }
        >
          <RFQCreateForm />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}

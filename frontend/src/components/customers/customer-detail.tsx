"use client";

import { Images, Pencil, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { EmptyState } from "@/components/domain/empty-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { PaymentTable } from "@/components/payments/payment-table";
import { SiteUpdateMediaGrid } from "@/components/site-updates/site-update-media-grid";
import { CustomerProjectProgress } from "@/components/customers/customer-project-progress";
import { useCustomer } from "@/hooks/use-customers";
import { useProjects } from "@/hooks/use-projects";
import { usePayments } from "@/hooks/use-payments";
import { useSiteUpdates } from "@/hooks/use-site-updates";
import { formatINR } from "@/lib/utils/format";
import type { Project } from "@/types/domain/project";

/**
 * Customer detail — built against the owner's 3-item scope for the
 * Customer Module ("Payments", "Progress percentage", "Progress
 * photographs", relayed via WhatsApp — see docs/CHANGELOG.md): a profile
 * card, one "Projects & Progress" block per linked `Project`, a Payments
 * rollup (reusing `PaymentTable`, exactly as `/admin/finance/payments`
 * renders it), and a Progress Photos gallery per project (reusing
 * `SiteUpdateMediaGrid`, filtered to `visibleToCustomer: true` — the same
 * photos this customer already sees in their own portal).
 *
 * `CustomerProjectProgress` (the "Projects & Progress" block) moved out to
 * its own file, `customer-project-progress.tsx`, in the "robust progress
 * mapping" follow-up pass — see that file's header comment for what it now
 * does beyond a plain editable number.
 */
export function CustomerDetail({ customerId, onEdit }: { customerId: string; onEdit: () => void }) {
  const { status, error, customer, refetch } = useCustomer(customerId);
  const { projects } = useProjects({ customerId });
  const { status: paymentsStatus, result: paymentsResult } = usePayments({ customerId, pageSize: 50 });

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <LoadingSkeleton className="h-32 w-full" />
        <LoadingSkeleton className="h-48 w-full" />
      </div>
    );
  }

  if (status === "error") {
    return <ErrorState title="Could not load this customer" description={error ?? undefined} onRetry={refetch} />;
  }

  if (!customer) {
    return <ErrorState title="Customer not found" />;
  }

  const payments = paymentsResult?.items ?? [];
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-ink">{customer.name}</h1>
              <p className="text-sm text-ink-muted">
                {customer.email} · {customer.phone}
              </p>
            </div>
            <PermissionGuard permission="customers:write">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </Button>
            </PermissionGuard>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={customer.leadId ? "brand" : "neutral"}>{customer.leadId ? "From Lead" : "Direct"}</Badge>
            {payments.length > 0 && <Badge variant="success">{formatINR(totalReceived)} received</Badge>}
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {customer.alternatePhone && (
              <div>
                <dt className="text-xs text-ink-muted">Alternate Phone</dt>
                <dd className="text-ink">{customer.alternatePhone}</dd>
              </div>
            )}
            {customer.address && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-muted">Address</dt>
                <dd className="text-ink">{customer.address}</dd>
              </div>
            )}
            {customer.notes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-muted">Internal Notes</dt>
                <dd className="text-ink">{customer.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <p className="font-heading text-sm font-semibold text-ink">Projects &amp; Progress</p>
          {projects.length === 0 ? (
            <EmptyState title="No projects linked yet" description="This customer has no project linked to their account." className="py-8" />
          ) : (
            <div className="flex flex-col gap-4">
              {projects.map((project) => (
                <CustomerProjectProgress key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-ink-muted" aria-hidden />
            <p className="font-heading text-sm font-semibold text-ink">Payments</p>
          </div>
          {paymentsStatus === "loading" ? (
            <LoadingSkeleton className="h-24 w-full" />
          ) : payments.length === 0 ? (
            <EmptyState title="No payments recorded yet" className="py-8" />
          ) : (
            <PaymentTable payments={payments} sortBy="paymentDate" sortDir="desc" onSortChange={() => {}} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Images className="h-4 w-4 text-ink-muted" aria-hidden />
            <p className="font-heading text-sm font-semibold text-ink">Progress Photographs</p>
          </div>
          {projects.length === 0 ? (
            <EmptyState title="No projects linked yet" className="py-8" />
          ) : (
            <div className="flex flex-col gap-6">
              {projects.map((project) => (
                <CustomerProjectPhotos key={project.id} project={project} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Per-project photo gallery — mirrors the customer portal's own filtering
 * (`visibleToCustomer: true`), so staff see exactly what this customer sees.
 */
function CustomerProjectPhotos({ project }: { project: Project }) {
  const { status, result } = useSiteUpdates({ projectId: project.id, visibleToCustomer: true, pageSize: 50 });
  const updates = result?.items ?? [];
  const allMedia = updates.flatMap((u) => u.media);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">{project.name}</p>
      {status === "loading" ? (
        <LoadingSkeleton className="h-24 w-full" />
      ) : allMedia.length === 0 ? (
        <EmptyState title="No photos posted yet" description="Site updates posted for this project will appear here." className="py-6" />
      ) : (
        <SiteUpdateMediaGrid media={allMedia} />
      )}
    </div>
  );
}

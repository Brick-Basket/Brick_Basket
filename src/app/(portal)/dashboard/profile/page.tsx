"use client";

import { User, Mail, Phone, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { useSession } from "@/components/providers/auth-provider";
import { useCustomers } from "@/hooks/use-customers";

/**
 * `/dashboard/profile` — implemented (post-Part-20 stabilization pass,
 * Phase 9; was a Part-3 scaffolded placeholder).
 *
 * FRONTEND IMPLEMENTATION DECISION: shows exactly the fields this app
 * actually has for the signed-in customer — `CurrentUser.name`/`.email`
 * from the session (`src/lib/auth/types.ts`), plus `phone` from the
 * matching `Customer` record when one exists (matched by
 * `id === session.user.id`, the same demo convention `Customer.ts`'s own
 * header comment documents for scoping "my contracts"). **No edit form is
 * offered.** Neither `AuthAdapter` nor `CustomersAdapter` (see
 * `docs/API_CONTRACTS.md`) defines an endpoint for a customer to update
 * their own profile — inventing an edit UI with nowhere real to send the
 * result would be worse than no edit UI at all. Add one the moment a real
 * "update my profile" contract is confirmed and implemented server-side.
 * See docs/OPEN_QUESTIONS.md #46.
 */
export default function Page() {
  const { session } = useSession();
  const { status: customersStatus, customers } = useCustomers();
  const customer = session ? customers.find((c) => c.id === session.user.id) : undefined;

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Profile</h1>
        <p className="text-sm text-ink-muted">Your account details.</p>
      </div>

      {!session ? (
        <LoadingSkeleton className="h-40 w-full" />
      ) : (
        <Card className="max-w-md p-6">
          <dl className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                <User className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Name</dt>
                <dd className="text-sm text-ink">{session.user.name}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Email</dt>
                <dd className="text-sm text-ink">{session.user.email}</dd>
              </div>
            </div>
            {customersStatus === "loading" ? (
              <LoadingSkeleton className="h-10 w-full" />
            ) : (
              customer?.phone && (
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                    <Phone className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Phone</dt>
                    <dd className="text-sm text-ink">{customer.phone}</dd>
                  </div>
                </div>
              )
            )}
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Account type</dt>
                <dd className="text-sm text-ink">Customer</dd>
              </div>
            </div>
          </dl>
          <p className="mt-6 border-t border-border pt-4 text-xs text-ink-muted">
            To update any of these details, contact BrickBasket directly — self-service profile editing isn&apos;t
            available yet.
          </p>
        </Card>
      )}
    </div>
  );
}

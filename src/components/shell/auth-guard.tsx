"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/components/providers/auth-provider";
import { PageLoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ErrorState } from "@/components/domain/error-state";
import type { Role } from "@/lib/permissions/permissions";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";

/**
 * Route-level auth boundary for the (portal) and (internal) layouts.
 *
 * - status "loading" (initial localStorage read not done yet): full-page skeleton.
 * - status "unauthenticated": redirect to /login?next=<path>.
 * - authenticated but role not in `allowedRoles`: 403 ErrorState (no redirect
 *   loop — the user IS signed in, they just can't be here).
 * - otherwise: render children.
 *
 * This is a UX convenience, not the security boundary — see
 * docs/AUTHENTICATION.md. The backend must independently reject
 * unauthorized requests regardless of what this component does.
 */
export function AuthGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: React.ReactNode }) {
  const { status, session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`${PUBLIC_ROUTES.login}?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return <PageLoadingSkeleton />;
  }

  if (status === "unauthenticated" || !session) {
    // Redirect is in flight via the effect above; render nothing meanwhile.
    return <PageLoadingSkeleton />;
  }

  const hasAccess = session.user.roles.some((role) => allowedRoles.includes(role));
  if (!hasAccess) {
    return (
      <div className="container">
        <ErrorState
          variant="forbidden"
          title="You don't have access to this area"
          description={`Your account (${session.user.roles.join(", ")}) doesn't include a role permitted here.`}
        />
      </div>
    );
  }

  return <>{children}</>;
}

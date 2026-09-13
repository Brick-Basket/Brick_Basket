"use client";

import type { Role } from "@/lib/permissions/permissions";
import { useHasRole } from "@/lib/permissions/use-permission";

/** Hides `children` (or renders `fallback`) unless the current user holds one of `roles`. */
export function RoleGuard({
  roles,
  fallback = null,
  children,
}: {
  roles: Role[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const allowed = useHasRole(...roles);
  return <>{allowed ? children : fallback}</>;
}

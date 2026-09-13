"use client";

import type { PermissionKey } from "@/lib/permissions/permissions";
import { usePermission } from "@/lib/permissions/use-permission";

/**
 * Hides `children` (or renders `fallback`) unless the current user holds
 * `permission`. UX-layer only — see docs/ROLES_AND_PERMISSIONS.md. Use this
 * around individual actions (an "Approve" button, a "Send for Acceptance"
 * button); use RoleGuard for whole-route/section gating.
 */
export function PermissionGuard({
  permission,
  fallback = null,
  children,
}: {
  permission: PermissionKey;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}

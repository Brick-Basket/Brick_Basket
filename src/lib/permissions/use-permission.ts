"use client";

import { useSession } from "@/components/providers/auth-provider";
import type { PermissionKey, Role } from "@/lib/permissions/permissions";

/**
 * True if the current user holds `permission`. Passing `undefined` means
 * "no permission required" (e.g. a nav item every signed-in user of a
 * shell may see) and always returns true while logged in, false while
 * logged out.
 */
export function usePermission(permission: PermissionKey | undefined): boolean {
  const { session } = useSession();
  if (!session) return false;
  if (permission === undefined) return true;
  return session.user.permissions.includes(permission);
}

/** True if the current user holds any of the given roles. False while logged out. */
export function useHasRole(...roles: Role[]): boolean {
  const { session } = useSession();
  if (!session) return false;
  return session.user.roles.some((r) => roles.includes(r));
}

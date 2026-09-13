/**
 * Frontend permission abstraction — see docs/ROLES_AND_PERMISSIONS.md.
 *
 * THIS IS UX-LAYER DEFENSE ONLY, NOT THE SECURITY BOUNDARY. The backend
 * must independently enforce authorization on every endpoint regardless of
 * what this hides or disables in the UI.
 *
 * The full role→permission matrix is not owner-confirmed (see
 * docs/OPEN_QUESTIONS.md #2) — this is a frontend default so navigation and
 * action guards have something real to key off during development.
 */
export type Role =
  | "admin"
  | "customer"
  | "project_manager"
  | "site_engineer"
  | "purchaser"
  | "store_personnel"
  | "finance"
  | "approver";

export const STAFF_ROLES: Role[] = [
  "admin",
  "project_manager",
  "site_engineer",
  "purchaser",
  "store_personnel",
  "finance",
  "approver",
];

export type PermissionKey =
  | "leads:read"
  | "leads:write"
  | "contracts:read"
  | "contracts:write"
  | "contracts:send_for_acceptance"
  | "contracts:accept"
  | "documents:read"
  | "documents:write"
  | "vendors:read"
  | "vendors:write"
  | "vendors:assess"
  | "ace:read"
  | "ace:write"
  | "requisitions:read"
  | "requisitions:create"
  | "requisitions:approve"
  | "rfq:read"
  | "rfq:compare"
  | "po:read"
  | "po:create"
  | "po:approve:level1"
  | "po:approve:level2"
  | "po:issue"
  | "grn:read"
  | "grn:create"
  | "stock:read"
  | "stock:write"
  | "wastage:read"
  | "wastage:write"
  | "store_requisitions:read"
  | "store_requisitions:create"
  | "store_requisitions:action"
  | "mrc:read"
  | "mrc:issue"
  | "mrc:accept"
  | "schedule:read"
  | "schedule:write"
  | "dpr:read"
  | "dpr:write"
  | "finance:read"
  | "finance:write"
  | "cost_management:view"
  | "admin:access";

/** Default role → permission set. CONFIGURABLE — pending client confirmation. */
export const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  admin: [
    "admin:access",
    "leads:read",
    "leads:write",
    "contracts:read",
    "contracts:write",
    "contracts:send_for_acceptance",
    "documents:read",
    "documents:write",
    "vendors:read",
    "vendors:write",
    "vendors:assess",
    "ace:read",
    "ace:write",
    "requisitions:read",
    "requisitions:create",
    "requisitions:approve",
    "rfq:read",
    "rfq:compare",
    "po:read",
    "po:create",
    "po:approve:level1",
    "po:approve:level2",
    "po:issue",
    "grn:read",
    "grn:create",
    "stock:read",
    "stock:write",
    "wastage:read",
    "wastage:write",
    "mrc:read",
    "mrc:issue",
    "store_requisitions:read",
    "store_requisitions:create",
    "store_requisitions:action",
    "schedule:read",
    "schedule:write",
    "dpr:read",
    "dpr:write",
    "finance:read",
    "finance:write",
    "cost_management:view",
  ],
  customer: ["contracts:read", "contracts:accept", "documents:read", "mrc:read", "mrc:accept", "finance:read"],
  project_manager: [
    "admin:access",
    "leads:read",
    "leads:write",
    "documents:read",
    "ace:read",
    "requisitions:read",
    "requisitions:create",
    "store_requisitions:read",
    "store_requisitions:create",
    "schedule:read",
    "schedule:write",
    "dpr:read",
    "dpr:write",
  ],
  site_engineer: [
    "admin:access",
    "dpr:read",
    "dpr:write",
    "schedule:read",
    "documents:read",
    "store_requisitions:read",
    "store_requisitions:create",
  ],
  purchaser: [
    "admin:access",
    "vendors:read",
    "ace:read",
    "ace:write",
    "requisitions:read",
    "requisitions:approve",
    "rfq:read",
    "rfq:compare",
    "po:read",
    "po:create",
    "po:issue",
  ],
  store_personnel: [
    "admin:access",
    "grn:read",
    "grn:create",
    "stock:read",
    "stock:write",
    "wastage:read",
    "wastage:write",
    "mrc:read",
    "mrc:issue",
    "store_requisitions:read",
    "store_requisitions:action",
  ],
  finance: ["admin:access", "finance:read", "finance:write", "po:read", "po:approve:level1"],
  approver: ["admin:access", "po:read", "po:approve:level1", "po:approve:level2"],
};

export function permissionsForRoles(roles: Role[]): PermissionKey[] {
  const set = new Set<PermissionKey>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) set.add(perm);
  }
  return [...set];
}

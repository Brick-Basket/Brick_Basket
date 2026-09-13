# Roles & Permissions (Frontend Abstraction)

**Status: implemented (Part 3).** `src/lib/permissions/permissions.ts` is the source of truth in code — this file documents it, not the other way around; if they ever drift, the code wins and this file needs updating.

**This is a frontend UX abstraction, not the authoritative security boundary.** The backend must independently enforce authorization on every endpoint regardless of what the frontend hides or disables. The full matrix below is a frontend default — see `docs/OPEN_QUESTIONS.md` #2.

## Roles

`admin`, `customer`, `project_manager`, `site_engineer`, `purchaser`, `store_personnel`, `finance`, `approver` — extensible; the owner requirements explicitly anticipate "other future operational roles." `STAFF_ROLES` = every role except `customer` — this is what gates the `/admin` shell (`AuthGuard`); `customer` alone gates the `/dashboard` portal shell.

## Permission key format

`<module>:<action>`. Implemented set (`PermissionKey` in `permissions.ts`): `leads:read`, `leads:write`, `contracts:read`, `contracts:write` (added Part 5 — create/edit a contract while it's a draft or declined; distinct from the send action below), `contracts:send_for_acceptance` (also covers the admin "withdraw to draft" action — both are the same "can move this contract in and out of customer review" capability), `contracts:accept` (customer action — also covers "decline"), `documents:read`, `documents:write`, `vendors:read`, `vendors:write`, `vendors:assess`, `ace:read`, `ace:write` (added Part 8 — the owner requirement's "read/edit states based on permission" for the ACE module), `requisitions:read`, `requisitions:create`, `requisitions:approve` (added Part 8 — distinct from `requisitions:create` since the owner text says a requisition "flows to admin/purchaser" for review, a different capability from raising one in the first place), `rfq:read`, `rfq:compare`, `po:read`, `po:create`, `po:approve:level1`, `po:approve:level2`, `po:issue`, `grn:read`, `grn:create`, `stock:read`, `stock:write`, `wastage:read`, `wastage:write`, `mrc:read`, `mrc:issue`, `mrc:accept` (customer action), `schedule:read`, `schedule:write`, `dpr:read`, `dpr:write`, `finance:read`, `finance:write`, `cost_management:view`, `admin:access` (general "can enter the staff area" flag, held by every non-customer role — not yet tied to any specific nav item, reserved for a coarse admin-only affordance), `store_requisitions:read`, `store_requisitions:create`, `store_requisitions:action` (all three added in the post-Part-20 stabilization pass, Phase 2, for the Store Material Requisition ("MR", §6B) module — `store_requisitions:action` deliberately covers both the Stores approve/reject decision and the issue step, since the owner's one-sentence requirement draws no distinction between them the way Purchase Requisition's review step does).

## Default role → permission map

| Role | Permissions (`ROLE_PERMISSIONS` in code) |
|---|---|
| `admin` | superset of every module permission except the two customer-only actions (`contracts:accept`, `mrc:accept`) |
| `customer` | `contracts:read`, `contracts:accept`, `documents:read`, `mrc:read`, `mrc:accept`, `finance:read` |
| `project_manager` | `admin:access`, `leads:read`, `leads:write`, `documents:read`, `ace:read`, `requisitions:read`, `requisitions:create`, `schedule:read`, `schedule:write`, `dpr:read`, `dpr:write`, `store_requisitions:read`, `store_requisitions:create` — can raise requisitions (both kinds) and see ACE rates, but not edit them |
| `site_engineer` | `admin:access`, `dpr:read`, `dpr:write`, `schedule:read`, `documents:read`, `store_requisitions:read`, `store_requisitions:create` — the owner names Site/Project Manager as the requester for Store Material Requisitions |
| `purchaser` | `admin:access`, `vendors:read`, `ace:read`, `ace:write`, `requisitions:read`, `requisitions:approve`, `rfq:read`, `rfq:compare`, `po:read`, `po:create`, `po:issue` — reviews requisitions (per the owner text: "Requisition flows to admin/purchaser") and maintains ACE rates, but does not raise requisitions itself |
| `store_personnel` | `admin:access`, `grn:read`, `grn:create`, `stock:read`, `stock:write`, `wastage:read`, `wastage:write`, `mrc:read`, `mrc:issue`, `store_requisitions:read`, `store_requisitions:action` — decides and issues Store Material Requisitions, the Stores-side counterpart to project_manager/site_engineer raising them |
| `finance` | `admin:access`, `finance:read`, `finance:write`, `po:read`, `po:approve:level1` (example only — pending confirmation) |
| `approver` | `admin:access`, `po:read`, `po:approve:level1`, `po:approve:level2` (exact mapping of who holds level 1 vs level 2 is **Open Question #2**) |

## Enforcement pattern (implemented)

- **Route-level**: `AuthGuard` (`src/components/shell/auth-guard.tsx`) checks `session.user.roles` against the route group's `allowedRoles`; unauthorized-but-signed-in → 403 `ErrorState`, not a redirect loop. Signed-out → redirect to `/login?next=`.
- **Nav-level**: `Sidebar`/`NavList` (`src/components/shell/sidebar.tsx`) filter every item through `usePermission(item.permission)` — an item with no `permission` set is visible to any signed-in user of that shell.
- **Action-level**: `<PermissionGuard permission="...">` (single permission) and `<RoleGuard roles={[...]}>` (role-based) wrap individual mutating actions — first used in Part 4 (Lead Management) and extended in Part 5 (Contract Management's "Send for Acceptance" / "Withdraw" / "Accept" / "Decline" buttons).
- **Session-expiry / logout**: `src/lib/auth` + `AuthProvider` — see `docs/AUTHENTICATION.md`.

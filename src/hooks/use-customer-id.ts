"use client";

import { useSession } from "@/components/providers/auth-provider";

/**
 * Sentinel passed to a customer-scoped list hook (`useProjects`,
 * `useContracts`, `useMRCs`, `usePayments`, ...) while no session exists
 * yet. Every one of those adapters' `list()` implementations follows the
 * same convention — `if (params.customerId) items = items.filter(...)`,
 * i.e. an *absent* `customerId` deliberately means "no filter, return
 * everything" (needed for admin/staff "list all" screens). A string that
 * can never equal a real record's `customerId` is what keeps that
 * convention from leaking every customer's data into a customer-portal
 * page during the page's own brief loading/unauthenticated window.
 */
const NO_SESSION_SENTINEL = "__no_session__";

/**
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass,
 * newly-discovered finding surfaced while doing Phase 9/10 work — not one
 * of the original 24 phases verbatim, but squarely in their spirit).
 *
 * Every customer-portal list page scopes its data with
 * `customerId: session?.user.id`. Passing that expression straight
 * through is a real bug, not just a style nit: `session` is `null` during
 * the provider's initial "loading" tick (see `auth-provider.tsx`) and
 * whenever a visitor isn't signed in, so `session?.user.id` evaluates to
 * `undefined` — which every adapter above treats as "no filter". For that
 * brief window, `/dashboard`, `/dashboard/projects`, `/dashboard/contracts`,
 * `/dashboard/mrc`, and `/dashboard/payments` were each listing *every*
 * customer's projects/contracts/MRCs/payments, not just the signed-in
 * customer's — confirmed by reading `ContractsAdapter.list()`,
 * `MRCAdapter.list()`, `PaymentsAdapter.list()`, and `ProjectsAdapter.list()`,
 * which all share the identical `if (params.customerId) filter(...)` shape.
 *
 * `useCustomerId()` is the one place that closes this gap, so every
 * customer-scoped list hook call in the portal goes through it instead of
 * five independent (and, before this fix, inconsistent) inline guards.
 * `PermissionGuard` limits who can reach these routes at all, but that is
 * an authorization check, not a data-scoping one — it does not stop an
 * authorized customer from momentarily seeing another customer's records
 * while `session` is still resolving. See docs/OPEN_QUESTIONS.md #47.
 */
export function useCustomerId(): string {
  const { session } = useSession();
  return session?.user.id ?? NO_SESSION_SENTINEL;
}

import { PageLoadingSkeleton } from "@/components/domain/loading-skeleton";

/**
 * Root `loading.tsx` (BrickBasket final hardening pass — App Router route
 * resilience). Next.js shows this automatically while a route segment's
 * Server Component tree is still resolving. Every page in this app today
 * fetches its data client-side through a hook (not an async Server
 * Component), so this boundary rarely activates in practice — it exists as
 * defensive infrastructure for the moment it does (a future async Server
 * Component, or the brief gap during a client-side route transition),
 * reusing the same `PageLoadingSkeleton` every per-page loading state
 * already uses rather than Next.js's blank default.
 */
export default function RootLoading() {
  return <PageLoadingSkeleton />;
}

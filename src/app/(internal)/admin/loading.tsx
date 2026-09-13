import { PageLoadingSkeleton } from "@/components/domain/loading-skeleton";

/**
 * Loading boundary for the `(internal)/admin` route segment (BrickBasket
 * final hardening pass). Same reasoning as the root `loading.tsx` — most
 * admin pages fetch client-side via a hook and already render their own
 * loading state, so this is defensive coverage for the segment-level gap,
 * not this app's primary loading UX.
 */
export default function AdminLoading() {
  return <PageLoadingSkeleton />;
}

import { PageLoadingSkeleton } from "@/components/domain/loading-skeleton";

/**
 * Loading boundary for the `(portal)/dashboard` route segment (BrickBasket
 * final hardening pass). Same reasoning as the admin segment's own
 * `loading.tsx`.
 */
export default function DashboardLoading() {
  return <PageLoadingSkeleton />;
}

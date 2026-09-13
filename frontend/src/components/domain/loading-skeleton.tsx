import { cn } from "@/lib/utils/cn";

/** Base shimmer block — compose into table-row/card-shaped skeletons per screen. */
export function LoadingSkeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-muted", className)} aria-hidden />;
}

/** Full-page loading state for route-level suspense (e.g. AuthGuard's initial session check). */
export function PageLoadingSkeleton() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3" role="status" aria-label="Loading">
      <LoadingSkeleton className="h-10 w-10 rounded-full" />
      <LoadingSkeleton className="h-3 w-32" />
    </div>
  );
}

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";

/**
 * Root `not-found.tsx` (BrickBasket final hardening pass — App Router route
 * resilience). Renders for any unmatched URL under this app, and for a
 * component-level `notFound()` call with no closer `not-found.tsx` of its
 * own. Server Component — no client-only behavior needed. Reuses this
 * app's own visual language (the same icon-chip/heading/muted-copy shape
 * `ErrorState` uses) rather than Next.js's unstyled default.
 */
export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-3 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="font-heading text-lg font-semibold text-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
      </p>
      <Link href={PUBLIC_ROUTES.home} className={buttonVariants({ size: "sm", className: "mt-2" })}>
        Back to homepage
      </Link>
    </div>
  );
}

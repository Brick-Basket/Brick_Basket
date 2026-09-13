"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/domain/error-state";

/**
 * Root route-segment error boundary (BrickBasket final hardening pass —
 * App Router route resilience). Catches an unhandled render/render-phase
 * error anywhere under the root layout that isn't already caught by a more
 * specific boundary, so a visitor sees this app's own `ErrorState` styling
 * instead of Next.js's default unstyled error screen. Must be a Client
 * Component — this is a Next.js requirement for every `error.tsx`.
 *
 * This is a last-resort UI boundary, not the app's real error handling —
 * every data-fetching hook already exposes its own `idle/loading/success/error`
 * status and renders `ErrorState` inline at the point of failure (see
 * `docs/ERROR_HANDLING.md`). This file only catches what those per-component
 * boundaries don't: an unexpected render-time exception.
 */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // No error-reporting service exists in this frontend-only build — see
    // docs/OPEN_QUESTIONS.md. A real deployment should report `error` (and
    // `error.digest`, the server-side reference Next.js attaches) to one
    // here.
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. You can try again, or head back to the homepage."
        onRetry={reset}
      />
    </div>
  );
}

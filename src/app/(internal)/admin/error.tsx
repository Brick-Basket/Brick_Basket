"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/domain/error-state";

/**
 * Error boundary for the `(internal)/admin` route segment (BrickBasket
 * final hardening pass). Catches an unhandled error anywhere under the
 * internal operations app that a page's own data-fetching hook didn't
 * already turn into an inline `ErrorState` (see `docs/ERROR_HANDLING.md`).
 * Scoped here rather than only relying on the root boundary so a crash in
 * one admin module doesn't take the app shell/sidebar down with it — the
 * root layout (and this segment's own `AdminLayout`/`AuthGuard`) keep
 * rendering around this boundary.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <ErrorState
        title="This section couldn't be loaded"
        description="Something went wrong loading this part of the admin console. Try again, or use the sidebar to go somewhere else."
        onRetry={reset}
      />
    </div>
  );
}

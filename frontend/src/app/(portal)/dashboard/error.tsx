"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/domain/error-state";

/**
 * Error boundary for the `(portal)/dashboard` route segment (BrickBasket
 * final hardening pass). Same reasoning as the admin segment's own
 * `error.tsx` — keeps a crash inside one customer-portal page from taking
 * the portal shell down with it.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <ErrorState
        title="This page couldn't be loaded"
        description="Something went wrong. Try again, or use the menu to go somewhere else."
        onRetry={reset}
      />
    </div>
  );
}

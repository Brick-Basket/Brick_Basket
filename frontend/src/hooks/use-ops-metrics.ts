"use client";

import { useCallback, useEffect, useState } from "react";
import { opsMetricsAdapter } from "@/lib/api/adapters/ops-metrics-adapter";
import { useSession } from "@/components/providers/auth-provider";
import type { OpsMetric } from "@/types/domain/ops-metric";

type Status = "idle" | "loading" | "success" | "error";

/** Loads the signed-in staff user's Ops Dashboard metric cards — see `OpsMetricsAdapter.getForUser` for the full source list. */
export function useOpsMetrics() {
  const { session } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<OpsMetric[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const user = session?.user;
    if (!user) {
      setStatus("idle");
      setMetrics([]);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    opsMetricsAdapter
      .getForUser(user)
      .then((result) => {
        if (cancelled) return;
        setMetrics(result);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load dashboard metrics. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, metrics, refetch };
}

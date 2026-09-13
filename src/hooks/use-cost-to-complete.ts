"use client";

import { useCallback, useEffect, useState } from "react";
import { costToCompleteAdapter } from "@/lib/api/adapters/cost-to-complete-adapter";
import type { CostToCompleteSummary } from "@/types/domain/cost-to-complete";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Loads the full Cost-to-Complete report for one project — see
 * `CostToCompleteAdapter.getSummary` for the calculation. There is no
 * create/update mutation here, unlike every other `use-*` hook in this
 * app: the report has nothing to submit, only a project to pick.
 */
export function useCostToComplete(projectId: string | undefined) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CostToCompleteSummary | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!projectId) {
      setStatus("idle");
      setResult(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    costToCompleteAdapter
      .getSummary(projectId)
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load the Cost-to-Complete report. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

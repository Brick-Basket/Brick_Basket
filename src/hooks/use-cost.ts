"use client";

import { useCallback, useEffect, useState } from "react";
import { costAdapter, type CostActor, type CostListParams, type CostListResult } from "@/lib/api/adapters/cost-adapter";
import type { CreateCostEntryInput, UpdateCostEntryInput } from "@/types/domain/cost-entry";

type Status = "idle" | "loading" | "success" | "error";

/** Lists cost entries for `/admin/finance/project-cost`. */
export function useCostEntries(params: CostListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CostListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    costAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load cost entries. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

function useMutation<Args extends unknown[], Result>(fn: (...args: Args) => Promise<Result>) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (...args: Args) => {
      setStatus("loading");
      setError(null);
      try {
        const result = await fn(...args);
        setStatus("success");
        return result;
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
        return null;
      }
    },
    // fn is a stable module-level adapter method reference in every caller below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { submit, status, error };
}

export function useCreateCostEntry() {
  return useMutation((input: CreateCostEntryInput, actor: CostActor) => costAdapter.create(input, actor));
}

export function useUpdateCostEntry() {
  return useMutation((id: string, patch: UpdateCostEntryInput, actor: CostActor) => costAdapter.update(id, patch, actor));
}

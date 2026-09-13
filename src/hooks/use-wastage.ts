"use client";

import { useCallback, useEffect, useState } from "react";
import { wastageAdapter, type WastageActor, type WastageListParams, type WastageListResult } from "@/lib/api/adapters/wastage-adapter";
import type { CreateWastageEntryInput, UpdateWastageEntryInput } from "@/types/domain/wastage-entry";

type Status = "idle" | "loading" | "success" | "error";

/** Lists wastage entries for `/admin/stores/wastage`'s Detail view (the Summary view aggregates this same result client-side). */
export function useWastageEntries(params: WastageListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WastageListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    wastageAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load wastage entries. Please try again.");
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

export function useCreateWastageEntry() {
  return useMutation((input: CreateWastageEntryInput, actor: WastageActor) => wastageAdapter.create(input, actor));
}

export function useUpdateWastageEntry() {
  return useMutation((id: string, patch: UpdateWastageEntryInput, actor: WastageActor) => wastageAdapter.update(id, patch, actor));
}

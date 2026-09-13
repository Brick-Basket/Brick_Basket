"use client";

import { useCallback, useEffect, useState } from "react";
import { stockAdapter, type StockActor, type StockListParams, type StockListResult } from "@/lib/api/adapters/stock-adapter";
import type { CreateStockEntryInput, UpdateStockEntryInput } from "@/types/domain/stock-entry";

type Status = "idle" | "loading" | "success" | "error";

/** Lists stock ledger rows for `/admin/stores/stock`. */
export function useStockEntries(params: StockListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    stockAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load the stock statement. Please try again.");
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

export function useCreateStockEntry() {
  return useMutation((input: CreateStockEntryInput, actor: StockActor) => stockAdapter.create(input, actor));
}

export function useUpdateStockEntry() {
  return useMutation((id: string, patch: UpdateStockEntryInput, actor: StockActor) => stockAdapter.update(id, patch, actor));
}

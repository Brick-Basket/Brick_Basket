"use client";

import { useCallback, useEffect, useState } from "react";
import { aceAdapter, type ACEActor, type ACEListParams, type ACEListResult } from "@/lib/api/adapters/ace-adapter";
import type { CreateACEItemInput, UpdateACEItemInput } from "@/types/domain/ace-item";

type Status = "idle" | "loading" | "success" | "error";

/** Lists ACE items for `/admin/supply-chain/ace` and the Requisition form's project-scoped item picker. */
export function useACEItems(params: ACEListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ACEListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    aceAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load ACE items. Please try again.");
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

export function useCreateACEItem() {
  return useMutation((input: CreateACEItemInput, actor: ACEActor) => aceAdapter.create(input, actor));
}

export function useUpdateACEItem() {
  return useMutation((id: string, patch: UpdateACEItemInput, actor: ACEActor) => aceAdapter.update(id, patch, actor));
}

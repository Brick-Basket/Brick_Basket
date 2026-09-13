"use client";

import { useCallback, useEffect, useState } from "react";
import { fixedAssetsAdapter, type FixedAssetActor, type FixedAssetListParams, type FixedAssetListResult } from "@/lib/api/adapters/fixed-assets-adapter";
import type { CreateFixedAssetInput, UpdateFixedAssetInput } from "@/types/domain/fixed-asset";

type Status = "idle" | "loading" | "success" | "error";

/** Lists Fixed Assets for `/admin/finance/fixed-assets`. */
export function useFixedAssets(params: FixedAssetListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FixedAssetListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    fixedAssetsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load fixed assets. Please try again.");
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

export function useCreateFixedAsset() {
  return useMutation((input: CreateFixedAssetInput, actor: FixedAssetActor) => fixedAssetsAdapter.create(input, actor));
}

export function useUpdateFixedAsset() {
  return useMutation((id: string, patch: UpdateFixedAssetInput, actor: FixedAssetActor) => fixedAssetsAdapter.update(id, patch, actor));
}

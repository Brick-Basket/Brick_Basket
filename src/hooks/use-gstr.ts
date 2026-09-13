"use client";

import { useCallback, useEffect, useState } from "react";
import { gstrAdapter, type GSTRActor, type GSTRListParams, type GSTRListResult } from "@/lib/api/adapters/gstr-adapter";
import type { CreateGSTRRecordInput, UpdateGSTRRecordInput } from "@/types/domain/gstr-record";

type Status = "idle" | "loading" | "success" | "error";

/** Lists GSTR records for `/admin/finance/gstr`. */
export function useGSTRRecords(params: GSTRListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GSTRListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    gstrAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load GSTR records. Please try again.");
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

export function useCreateGSTRRecord() {
  return useMutation((input: CreateGSTRRecordInput, actor: GSTRActor) => gstrAdapter.create(input, actor));
}

export function useUpdateGSTRRecord() {
  return useMutation((id: string, patch: UpdateGSTRRecordInput, actor: GSTRActor) => gstrAdapter.update(id, patch, actor));
}

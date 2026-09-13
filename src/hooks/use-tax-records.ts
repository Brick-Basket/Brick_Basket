"use client";

import { useCallback, useEffect, useState } from "react";
import { taxRecordsAdapter, type TaxRecordActor, type TaxRecordListParams, type TaxRecordListResult } from "@/lib/api/adapters/tax-records-adapter";
import type { CreateTaxRecordInput, UpdateTaxRecordInput } from "@/types/domain/tax-record";

type Status = "idle" | "loading" | "success" | "error";

/** Lists Tax records for `/admin/finance/taxes`. */
export function useTaxRecords(params: TaxRecordListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TaxRecordListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    taxRecordsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load tax records. Please try again.");
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

export function useCreateTaxRecord() {
  return useMutation((input: CreateTaxRecordInput, actor: TaxRecordActor) => taxRecordsAdapter.create(input, actor));
}

export function useUpdateTaxRecord() {
  return useMutation((id: string, patch: UpdateTaxRecordInput, actor: TaxRecordActor) => taxRecordsAdapter.update(id, patch, actor));
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  bankTransactionAdapter,
  type BankTransactionActor,
  type BankTransactionListParams,
  type BankTransactionListResult,
} from "@/lib/api/adapters/bank-adapter";
import type { CreateBankTransactionInput, UpdateBankTransactionInput } from "@/types/domain/bank-transaction";

type Status = "idle" | "loading" | "success" | "error";

/** Lists Bank & Cash entries for `/admin/finance/bank-cash`. */
export function useBankTransactions(params: BankTransactionListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BankTransactionListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    bankTransactionAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load bank & cash entries. Please try again.");
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

export function useCreateBankTransaction() {
  return useMutation((input: CreateBankTransactionInput, actor: BankTransactionActor) => bankTransactionAdapter.create(input, actor));
}

export function useUpdateBankTransaction() {
  return useMutation((id: string, patch: UpdateBankTransactionInput, actor: BankTransactionActor) =>
    bankTransactionAdapter.update(id, patch, actor),
  );
}

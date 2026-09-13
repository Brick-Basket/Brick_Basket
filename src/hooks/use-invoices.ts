"use client";

import { useCallback, useEffect, useState } from "react";
import { invoiceAdapter, type InvoiceActor, type InvoiceListParams, type InvoiceListResult } from "@/lib/api/adapters/invoices-adapter";
import type { CreateInvoiceInput, UpdateInvoiceInput } from "@/types/domain/invoice";

type Status = "idle" | "loading" | "success" | "error";

/** Lists vendor invoices for the Invoices tab of `/admin/finance/payments`, and the Payment form's invoice picker. */
export function useInvoices(params: InvoiceListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InvoiceListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    invoiceAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load invoices. Please try again.");
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

export function useCreateInvoice() {
  return useMutation((input: CreateInvoiceInput, actor: InvoiceActor) => invoiceAdapter.create(input, actor));
}

export function useUpdateInvoice() {
  return useMutation((id: string, patch: UpdateInvoiceInput, actor: InvoiceActor) => invoiceAdapter.update(id, patch, actor));
}

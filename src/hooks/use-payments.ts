"use client";

import { useCallback, useEffect, useState } from "react";
import { paymentAdapter, type PaymentActor, type PaymentListParams, type PaymentListResult } from "@/lib/api/adapters/payments-adapter";
import type { CreatePaymentInput, UpdatePaymentInput } from "@/types/domain/payment";

type Status = "idle" | "loading" | "success" | "error";

/** Lists payments/receipts for the Payments & Receipts tab of `/admin/finance/payments`, and the customer `/dashboard/payments` view. */
export function usePayments(params: PaymentListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    paymentAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load payments. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/**
 * Every `"payment"`-direction row, unpaginated — backs
 * `getTotalPaidForInvoice`/`getInvoicePaymentStatus` on the Invoices tab,
 * the same "fetch the whole aggregate once, compute client-side" trick
 * `useScheduleProgressMap` used (Part 13).
 */
export function useVendorPayments() {
  return usePayments({ direction: "payment", page: 1, pageSize: 200 });
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

export function useCreatePayment() {
  return useMutation((input: CreatePaymentInput, actor: PaymentActor) => paymentAdapter.create(input, actor));
}

export function useUpdatePayment() {
  return useMutation((id: string, patch: UpdatePaymentInput, actor: PaymentActor) => paymentAdapter.update(id, patch, actor));
}

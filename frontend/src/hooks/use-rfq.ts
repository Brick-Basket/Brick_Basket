"use client";

import { useCallback, useEffect, useState } from "react";
import { rfqAdapter, type RFQActor, type RFQListParams, type RFQListResult } from "@/lib/api/adapters/rfq-adapter";
import type { CreateRFQInput, RFQ, RFQLine, RFQVendorQuote, UpdateRFQInput } from "@/types/domain/rfq";

type Status = "idle" | "loading" | "success" | "error";

/** Lists RFQs for `/admin/supply-chain/rfqs`. */
export function useRFQs(params: RFQListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RFQListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    rfqAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load RFQs. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-RFQ detail + its comparison lines and vendor quotes, for the detail page. */
export function useRFQ(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [lines, setLines] = useState<RFQLine[]>([]);
  const [quotes, setQuotes] = useState<RFQVendorQuote[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setRFQ(null);
      setLines([]);
      setQuotes([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([rfqAdapter.get(id), rfqAdapter.listLines(id), rfqAdapter.listVendorQuotes(id)])
      .then(([foundRFQ, foundLines, foundQuotes]) => {
        if (cancelled) return;
        setRFQ(foundRFQ);
        setLines(foundLines);
        setQuotes(foundQuotes);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this RFQ. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, rfq, lines, quotes, refetch };
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

export function useCreateRFQ() {
  return useMutation((input: CreateRFQInput, actor: RFQActor) => rfqAdapter.create(input, actor));
}

export function useUpdateRFQ() {
  return useMutation((id: string, patch: UpdateRFQInput, actor: RFQActor) => rfqAdapter.update(id, patch, actor));
}

export function useSetVendorQuote() {
  return useMutation((rfqId: string, lineId: string, vendorId: string, rate: number, actor: RFQActor) =>
    rfqAdapter.setVendorQuote(rfqId, lineId, vendorId, rate, actor),
  );
}

export function useRemoveVendorQuote() {
  return useMutation((rfqId: string, lineId: string, vendorId: string, actor: RFQActor) => rfqAdapter.removeVendorQuote(rfqId, lineId, vendorId, actor));
}

export function useSelectVendor() {
  return useMutation((rfqId: string, lineId: string, vendorId: string | null, actor: RFQActor) => rfqAdapter.selectVendor(rfqId, lineId, vendorId, actor));
}

export function useFinalizeRFQ() {
  return useMutation((rfqId: string, actor: RFQActor) => rfqAdapter.finalize(rfqId, actor));
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { grnAdapter, type GRNActor, type GRNListParams, type GRNListResult } from "@/lib/api/adapters/grn-adapter";
import type { CreateGRNInput, GRN, GRNLineItem, UpdateGRNInput } from "@/types/domain/grn";

type Status = "idle" | "loading" | "success" | "error";

/** Lists GRNs for `/admin/stores/grn`. */
export function useGRNs(params: GRNListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GRNListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    grnAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load GRNs. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-GRN detail + its line items, for the detail page. */
export function useGRN(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [grn, setGRN] = useState<GRN | null>(null);
  const [lineItems, setLineItems] = useState<GRNLineItem[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setGRN(null);
      setLineItems([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([grnAdapter.get(id), grnAdapter.listLineItems(id)])
      .then(([foundGRN, foundLineItems]) => {
        if (cancelled) return;
        setGRN(foundGRN);
        setLineItems(foundLineItems);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this GRN. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, grn, lineItems, refetch };
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

export function useCreateGRN() {
  return useMutation((input: CreateGRNInput, actor: GRNActor) => grnAdapter.create(input, actor));
}

export function useUpdateGRN() {
  return useMutation((id: string, patch: UpdateGRNInput, actor: GRNActor) => grnAdapter.update(id, patch, actor));
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { boqRatesAdapter } from "@/lib/api/adapters/boq-rates-adapter";
import type { BoqRateItem, UpdateBoqRateItemInput } from "@/types/domain/boq-rate-item";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Lists all 11 BOQ rate items — used both by the Cost Estimator (public,
 * read-only) and `/admin/pricing-content` (admin, editable). React
 * Query-shaped: swapping to a real `useQuery` later only touches this
 * file's internals.
 */
export function useBoqRates() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<BoqRateItem[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    boqRatesAdapter
      .list()
      .then((res) => {
        if (cancelled) return;
        setItems(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load material & labor rates. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, items, refetch };
}

/** Mutation hook for editing one BOQ rate item from `/admin/pricing-content`. */
export function useUpdateBoqRateItem() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (id: string, patch: UpdateBoqRateItemInput, actor?: { name: string }) => {
    setStatus("loading");
    setError(null);
    try {
      const updated = await boqRatesAdapter.update(id, patch, actor);
      setStatus("success");
      return updated;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not save this rate. Please try again.");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { submit, status, error, reset };
}

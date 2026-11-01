"use client";

import { useCallback, useEffect, useState } from "react";
import { stockAdapter, type StockActor, type StockListParams, type StockListResult } from "@/lib/api/adapters/stock-adapter";
import type { CreateStockEntryInput, MaterialReceiptSummary, StockMaterial, StockTrace, UpdateStockEntryInput } from "@/types/domain/stock-entry";

type Status = "idle" | "loading" | "success" | "error";

/** Lists stock ledger rows for `/admin/stores/stock`. */
export function useStockEntries(params: StockListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StockListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    stockAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load the stock statement. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/**
 * Cross-module reconciliation trace for one (project, material, date) key
 * — what GRN/Store Requisition ("MR")/Wastage recorded for that same day,
 * so `StockForm` can show it alongside the manually entered Received/
 * Consumed fields instead of leaving those three modules as unconnected
 * silos (see `StockAdapter.getTrace` and docs/OPEN_QUESTIONS.md #32).
 * Stays idle (`trace: null`) until `projectId`/`material`/`date` are all set.
 */
export function useStockTrace(projectId: string, material: StockMaterial, date: string) {
  const [status, setStatus] = useState<Status>("idle");
  const [trace, setTrace] = useState<StockTrace | null>(null);

  useEffect(() => {
    if (!projectId || !material || !date) {
      setTrace(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    stockAdapter
      .getTrace(projectId, material, date)
      .then((res) => {
        if (cancelled) return;
        setTrace(res);
        setStatus("success");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, material, date]);

  return { status, trace };
}

/**
 * All-time GRN receipt visibility for one (project, material) key — backs
 * `StoreRequisitionForm`'s "Received via GRN" panel, so a Material
 * Requisition can be raised with the actual receipt history in view
 * instead of the two modules being unconnected (see
 * `StockAdapter.getMaterialReceiptSummary`). Stays idle (`summary: null`)
 * until `projectId`/`material` are both set.
 */
export function useMaterialReceiptSummary(projectId: string, material: StockMaterial) {
  const [status, setStatus] = useState<Status>("idle");
  const [summary, setSummary] = useState<MaterialReceiptSummary | null>(null);

  useEffect(() => {
    if (!projectId || !material) {
      setSummary(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    stockAdapter
      .getMaterialReceiptSummary(projectId, material)
      .then((res) => {
        if (cancelled) return;
        setSummary(res);
        setStatus("success");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, material]);

  return { status, summary };
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

export function useCreateStockEntry() {
  return useMutation((input: CreateStockEntryInput, actor: StockActor) => stockAdapter.create(input, actor));
}

export function useUpdateStockEntry() {
  return useMutation((id: string, patch: UpdateStockEntryInput, actor: StockActor) => stockAdapter.update(id, patch, actor));
}

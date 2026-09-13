"use client";

import { useCallback, useEffect, useState } from "react";
import {
  dprAdapter,
  type DPRActor,
  type DPRListParams,
  type DPRListResult,
  type DPRWorkItemHistoryEntry,
} from "@/lib/api/adapters/dpr-adapter";
import type { CreateDPRInput, DPR, DPRManpowerEntry, DPRWorkItemEntry, UpdateDPRInput } from "@/types/domain/dpr";

type Status = "idle" | "loading" | "success" | "error";

/** Lists DPRs for `/admin/project-management/dpr`. */
export function useDPRs(params: DPRListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DPRListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    dprAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load daily progress reports. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-DPR detail + its manpower rows and work-item lines, for the detail/edit pages. */
export function useDPR(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dpr, setDpr] = useState<DPR | null>(null);
  const [manpower, setManpower] = useState<DPRManpowerEntry[]>([]);
  const [workItems, setWorkItems] = useState<DPRWorkItemEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setDpr(null);
      setManpower([]);
      setWorkItems([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([dprAdapter.get(id), dprAdapter.listManpowerEntries(id), dprAdapter.listWorkItemLines(id)])
      .then(([foundDpr, foundManpower, foundWorkItems]) => {
        if (cancelled) return;
        setDpr(foundDpr);
        setManpower(foundManpower);
        setWorkItems(foundWorkItems);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this daily progress report. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, dpr, manpower, workItems, refetch };
}

/**
 * Every work-item line across every DPR for one project, oldest first —
 * backs the create/edit form's per-line "previous qty"/"planned qty
 * default" computation (`dpr-work-item-math.ts`), the same unpaginated
 * "aggregate view" trick already used by `useGRNLinesForPicker` (Part 12)
 * and Wastage's summary toggle (Part 11).
 */
export function useDPRWorkItemHistory(projectId: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [history, setHistory] = useState<DPRWorkItemHistoryEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!projectId) {
      setHistory([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    dprAdapter
      .listWorkItemHistory(projectId)
      .then((res) => {
        if (cancelled) return;
        setHistory(res);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, history, refetch };
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

export function useCreateDPR() {
  return useMutation((input: CreateDPRInput, actor: DPRActor) => dprAdapter.create(input, actor));
}

export function useUpdateDPR() {
  return useMutation((id: string, patch: UpdateDPRInput, actor: DPRActor) => dprAdapter.update(id, patch, actor));
}

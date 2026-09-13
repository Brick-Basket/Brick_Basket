"use client";

import { useCallback, useEffect, useState } from "react";
import {
  storeRequisitionsAdapter,
  type StoreRequisitionActor,
  type StoreRequisitionListParams,
  type StoreRequisitionListResult,
} from "@/lib/api/adapters/store-requisitions-adapter";
import type {
  CreateStoreRequisitionInput,
  StoreRequisition,
  StoreRequisitionDecisionInput,
  UpdateStoreRequisitionInput,
} from "@/types/domain/store-requisition";

type Status = "idle" | "loading" | "success" | "error";

/** Lists Store Material Requisitions for `/admin/stores/requisitions`. */
export function useStoreRequisitions(params: StoreRequisitionListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StoreRequisitionListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    storeRequisitionsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load store requisitions. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single store-requisition detail, for the detail page. */
export function useStoreRequisition(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [requisition, setRequisition] = useState<StoreRequisition | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setRequisition(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    storeRequisitionsAdapter
      .get(id)
      .then((found) => {
        if (cancelled) return;
        setRequisition(found);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this request. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, requisition, refetch };
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

export function useCreateStoreRequisition() {
  return useMutation((input: CreateStoreRequisitionInput, actor: StoreRequisitionActor) =>
    storeRequisitionsAdapter.create(input, actor),
  );
}

export function useUpdateStoreRequisition() {
  return useMutation((id: string, patch: UpdateStoreRequisitionInput, actor: StoreRequisitionActor) =>
    storeRequisitionsAdapter.update(id, patch, actor),
  );
}

export function useSubmitStoreRequisition() {
  return useMutation((id: string, actor: StoreRequisitionActor) => storeRequisitionsAdapter.submit(id, actor));
}

export function useDecideStoreRequisition() {
  return useMutation(
    (id: string, decision: "approved" | "rejected", input: StoreRequisitionDecisionInput, actor: StoreRequisitionActor) =>
      storeRequisitionsAdapter.decide(id, decision, input, actor),
  );
}

export function useIssueStoreRequisition() {
  return useMutation((id: string, actor: StoreRequisitionActor) => storeRequisitionsAdapter.issue(id, actor));
}

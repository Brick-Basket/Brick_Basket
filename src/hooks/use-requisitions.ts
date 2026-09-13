"use client";

import { useCallback, useEffect, useState } from "react";
import {
  requisitionsAdapter,
  type RequisitionActor,
  type RequisitionListParams,
  type RequisitionListResult,
} from "@/lib/api/adapters/requisitions-adapter";
import type { CreatePurchaseRequisitionInput, MaterialRequirement, PurchaseRequisition, UpdatePurchaseRequisitionInput } from "@/types/domain/requisition";
import type { RequisitionAuditEntry } from "@/types/domain/requisition-audit";

type Status = "idle" | "loading" | "success" | "error";

/** Lists requisitions for `/admin/supply-chain/requisitions`. */
export function useRequisitions(params: RequisitionListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RequisitionListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    requisitionsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load requisitions. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-requisition detail + its material requirement lines and audit history, for the detail page. */
export function useRequisition(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [requisition, setRequisition] = useState<PurchaseRequisition | null>(null);
  const [lines, setLines] = useState<MaterialRequirement[]>([]);
  const [audit, setAudit] = useState<RequisitionAuditEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setRequisition(null);
      setLines([]);
      setAudit([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([requisitionsAdapter.get(id), requisitionsAdapter.listLines(id), requisitionsAdapter.listAuditHistory(id)])
      .then(([foundRequisition, foundLines, foundAudit]) => {
        if (cancelled) return;
        setRequisition(foundRequisition);
        setLines(foundLines);
        setAudit(foundAudit);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this requisition. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, requisition, lines, audit, refetch };
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

export function useCreateRequisition() {
  return useMutation((input: CreatePurchaseRequisitionInput, actor: RequisitionActor) => requisitionsAdapter.create(input, actor));
}

export function useUpdateRequisition() {
  return useMutation((id: string, patch: UpdatePurchaseRequisitionInput, actor: RequisitionActor) => requisitionsAdapter.update(id, patch, actor));
}

export function useSubmitRequisition() {
  return useMutation((id: string, actor: RequisitionActor) => requisitionsAdapter.submit(id, actor));
}

export function useDecideRequisition() {
  return useMutation((id: string, decision: "approved" | "rejected", actor: RequisitionActor, rejectReason?: string) =>
    requisitionsAdapter.decide(id, decision, actor, rejectReason),
  );
}

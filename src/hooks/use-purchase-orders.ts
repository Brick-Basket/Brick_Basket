"use client";

import { useCallback, useEffect, useState } from "react";
import {
  purchaseOrdersAdapter,
  type PurchaseOrderActor,
  type PurchaseOrderListParams,
  type PurchaseOrderListResult,
} from "@/lib/api/adapters/purchase-orders-adapter";
import type { CreatePurchaseOrderInput, PurchaseOrder, PurchaseOrderLineItem, UpdatePurchaseOrderInput } from "@/types/domain/purchase-order";
import type { Approval, ApprovalDecision } from "@/types/domain/approval";
import type { PurchaseOrderAuditEntry } from "@/types/domain/purchase-order-audit";

type Status = "idle" | "loading" | "success" | "error";

/** Lists Purchase Orders for `/admin/purchase-orders`, and for the RFQ detail page's "already has a PO?" check per vendor group. */
export function usePurchaseOrders(params: PurchaseOrderListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseOrderListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    purchaseOrdersAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load Purchase Orders. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-PO detail + its line items, approvals and audit history, for the detail page. */
export function usePurchaseOrder(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [lineItems, setLineItems] = useState<PurchaseOrderLineItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [audit, setAudit] = useState<PurchaseOrderAuditEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setPurchaseOrder(null);
      setLineItems([]);
      setApprovals([]);
      setAudit([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([
      purchaseOrdersAdapter.get(id),
      purchaseOrdersAdapter.listLineItems(id),
      purchaseOrdersAdapter.listApprovals(id),
      purchaseOrdersAdapter.listAuditHistory(id),
    ])
      .then(([foundPO, foundLineItems, foundApprovals, foundAudit]) => {
        if (cancelled) return;
        setPurchaseOrder(foundPO);
        setLineItems(foundLineItems);
        setApprovals(foundApprovals);
        setAudit(foundAudit);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this Purchase Order. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, purchaseOrder, lineItems, approvals, audit, refetch };
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

export function useCreatePurchaseOrder() {
  return useMutation((input: CreatePurchaseOrderInput, actor: PurchaseOrderActor) => purchaseOrdersAdapter.create(input, actor));
}

export function useUpdatePurchaseOrder() {
  return useMutation((id: string, patch: UpdatePurchaseOrderInput, actor: PurchaseOrderActor) => purchaseOrdersAdapter.update(id, patch, actor));
}

export function useSubmitPurchaseOrder() {
  return useMutation((id: string, actor: PurchaseOrderActor) => purchaseOrdersAdapter.submit(id, actor));
}

export function useDecideLevel1() {
  return useMutation((id: string, decision: ApprovalDecision, actor: PurchaseOrderActor, comment?: string) =>
    purchaseOrdersAdapter.decideLevel1(id, decision, actor, comment),
  );
}

export function useDecideLevel2() {
  return useMutation((id: string, decision: ApprovalDecision, actor: PurchaseOrderActor, comment?: string) =>
    purchaseOrdersAdapter.decideLevel2(id, decision, actor, comment),
  );
}

export function useReleasePurchaseOrder() {
  return useMutation((id: string, actor: PurchaseOrderActor) => purchaseOrdersAdapter.release(id, actor));
}

export function useIssuePurchaseOrder() {
  return useMutation((id: string, actor: PurchaseOrderActor) => purchaseOrdersAdapter.issue(id, actor));
}

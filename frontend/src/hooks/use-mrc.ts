"use client";

import { useCallback, useEffect, useState } from "react";
import {
  mrcAdapter,
  type MRCActor,
  type MRCListParams,
  type MRCListResult,
} from "@/lib/api/adapters/mrc-adapter";
import { grnAdapter } from "@/lib/api/adapters/grn-adapter";
import type { GRN, GRNLineItem } from "@/types/domain/grn";
import type { MRC, MRCLineItem, CreateMRCInput, UpdateMRCInput } from "@/types/domain/mrc";

type Status = "idle" | "loading" | "success" | "error";

/** Lists MRCs for `/admin/stores/mrc` and `/dashboard/mrc` (the latter always passes a fixed `customerId`). */
export function useMRCs(params: MRCListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MRCListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    mrcAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load material receipt certificates. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-MRC detail + its line items, for the detail page. */
export function useMRC(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mrc, setMrc] = useState<MRC | null>(null);
  const [lineItems, setLineItems] = useState<MRCLineItem[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setMrc(null);
      setLineItems([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([mrcAdapter.get(id), mrcAdapter.listLineItems(id)])
      .then(([foundMrc, foundLines]) => {
        if (cancelled) return;
        setMrc(foundMrc);
        setLineItems(foundLines);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this MRC. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, mrc, lineItems, refetch };
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

export function useCreateMRC() {
  const { submit, status, error } = useMutation((input: CreateMRCInput, actor: MRCActor) => mrcAdapter.create(input, actor));
  return { submit, status, error };
}

export function useUpdateMRC() {
  const { submit, status, error } = useMutation((id: string, patch: UpdateMRCInput, actor: MRCActor) =>
    mrcAdapter.update(id, patch, actor),
  );
  return { submit, status, error };
}

export function useIssueMRC() {
  const { submit, status, error } = useMutation((id: string, actor: MRCActor) => mrcAdapter.issue(id, actor));
  return { submit, status, error };
}

export function useWithdrawMRC() {
  const { submit, status, error } = useMutation((id: string, actor: MRCActor) => mrcAdapter.withdraw(id, actor));
  return { submit, status, error };
}

export function useRespondToMRC() {
  const { submit, status, error } = useMutation(
    (id: string, decision: "accepted" | "declined", actor: MRCActor, declineReason?: string) =>
      mrcAdapter.respond(id, decision, actor, declineReason),
  );
  return { submit, status, error };
}

export interface GRNLinePickerOption {
  line: GRNLineItem;
  grn: GRN;
}

/**
 * Every GRN line item across every GRN, paired with its parent GRN — backs
 * the `source: "grn"` picker in `MRCLineItemsEditor`. Fetches both lists
 * unpaginated (demo-scale data only), the same "aggregate view" trick used
 * by Wastage's summary toggle (Part 11).
 */
export function useGRNLinesForPicker() {
  const [status, setStatus] = useState<Status>("idle");
  const [options, setOptions] = useState<GRNLinePickerOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    Promise.all([grnAdapter.list({ pageSize: 1000 }), grnAdapter.listAllLineItems()])
      .then(([grnResult, lines]) => {
        if (cancelled) return;
        const grnsById = new Map(grnResult.items.map((g) => [g.id, g]));
        const paired = lines
          .map((line) => {
            const grn = grnsById.get(line.grnId);
            return grn ? { line, grn } : null;
          })
          .filter((o): o is GRNLinePickerOption => o !== null);
        setOptions(paired);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, options };
}

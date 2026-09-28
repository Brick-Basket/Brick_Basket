"use client";

import { useCallback, useEffect, useState } from "react";
import {
  siteUpdatesAdapter,
  type SiteUpdateActor,
  type SiteUpdateListParams,
  type SiteUpdateListResult,
} from "@/lib/api/adapters/site-updates-adapter";
import type { CreateSiteUpdateInput, SiteUpdate, UpdateSiteUpdateInput } from "@/types/domain/site-update";

type Status = "idle" | "loading" | "success" | "error";

/** Lists site updates for `/admin/site-updates` and `/dashboard/site-updates` (the latter always passes `visibleToCustomer: true` + its own `projectId`). */
export function useSiteUpdates(params: SiteUpdateListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SiteUpdateListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    siteUpdatesAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load site updates. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-update detail, for the detail panel. */
export function useSiteUpdate(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [update, setUpdate] = useState<SiteUpdate | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setUpdate(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    siteUpdatesAdapter
      .get(id)
      .then((found) => {
        if (cancelled) return;
        setUpdate(found);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this update. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, update, refetch };
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

export function useCreateSiteUpdate() {
  return useMutation(
    (
      input: CreateSiteUpdateInput,
      files: File[],
      mediaMeta: { type: "photo" | "video"; caption?: string }[],
      actor: SiteUpdateActor,
    ) => siteUpdatesAdapter.create(input, files, mediaMeta, actor),
  );
}

export function useUpdateSiteUpdate() {
  return useMutation((id: string, patch: UpdateSiteUpdateInput) => siteUpdatesAdapter.update(id, patch));
}

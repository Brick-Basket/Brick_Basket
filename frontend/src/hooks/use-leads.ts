"use client";

import { useCallback, useEffect, useState } from "react";
import { leadsAdapter, type LeadListParams, type LeadListResult } from "@/lib/api/adapters/leads-adapter";
import type { CreateLeadInput, Lead, LeadStatus, UpdateLeadInput } from "@/types/domain/lead";
import type { LeadActivity } from "@/types/domain/lead-activity";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Lists leads for `/admin/leads` (table + Kanban share this one hook —
 * Kanban requests a large `pageSize` to see every status column at once).
 * React Query-shaped: swapping to a real `useQuery` later only touches this
 * file's internals.
 */
export function useLeads(params: LeadListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    leadsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load leads. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-lead detail + its follow-up activity log, for the detail drawer. */
export function useLead(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setLead(null);
      setActivities([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([leadsAdapter.get(id), leadsAdapter.listActivities(id)])
      .then(([foundLead, foundActivities]) => {
        if (cancelled) return;
        setLead(foundLead);
        setActivities(foundActivities);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this lead. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, lead, activities, refetch };
}

/**
 * Create a manually-captured lead (a call, a walk-in).
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 10/13 fix): `LeadForm` used to call `leadsAdapter.create()` directly —
 * the one component in this app that bypassed the
 * Component → hook → adapter boundary every other module follows, and
 * with no try/catch, so a failed create had no error path at all (it would
 * have surfaced as an uncaught promise rejection, not `submitError`). This
 * hook restores both: the adapter boundary, and a caught, user-visible
 * error consistent with `useUpdateLead`/every other mutation hook in this
 * app.
 */
export function useCreateLead() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: CreateLeadInput) => {
    setStatus("loading");
    setError(null);
    try {
      const created = await leadsAdapter.create(input);
      setStatus("success");
      return created;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not create this lead. Please try again.");
      return null;
    }
  }, []);

  return { submit, status, error };
}

/** Update lead fields (edit form, assignment). */
export function useUpdateLead() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (id: string, patch: UpdateLeadInput) => {
    setStatus("loading");
    setError(null);
    try {
      const updated = await leadsAdapter.update(id, patch);
      setStatus("success");
      return updated;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not save changes. Please try again.");
      return null;
    }
  }, []);

  return { submit, status, error };
}

/** Pipeline-status transitions (table row action, Kanban column move). */
export function useTransitionLead() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (id: string, next: LeadStatus) => {
    setStatus("loading");
    setError(null);
    try {
      const updated = await leadsAdapter.transition(id, next);
      setStatus("success");
      return updated;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not update status. Please try again.");
      return null;
    }
  }, []);

  return { submit, status, error };
}

/** Appends a follow-up note to a lead's activity log. */
export function useAddLeadActivity() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (leadId: string, message: string, author: { id: string; name: string }) => {
    setStatus("loading");
    setError(null);
    try {
      const activity = await leadsAdapter.addActivity(leadId, message, author);
      setStatus("success");
      return activity;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not add the note. Please try again.");
      return null;
    }
  }, []);

  return { submit, status, error };
}

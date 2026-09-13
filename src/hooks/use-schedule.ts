"use client";

import { useCallback, useEffect, useState } from "react";
import {
  scheduleAdapter,
  type ScheduleActor,
  type ScheduleListParams,
  type ScheduleListResult,
} from "@/lib/api/adapters/schedule-adapter";
import type {
  CreateScheduleActivityInput,
  CreateScheduleProgressInput,
  ScheduleProgressEntry,
  UpdateScheduleActivityInput,
} from "@/types/domain/project-schedule";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Lists schedule activities for `/admin/project-management/schedule`. The
 * page always requests a large `pageSize` — a Gantt/schedule-table hybrid
 * needs every activity in view at once for the chart to make sense, not a
 * paginated slice, so this module deliberately skips a `Pagination`
 * control unlike every other list screen.
 */
export function useScheduleActivities(params: ScheduleListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScheduleListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    scheduleAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load the schedule. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** One activity's progress log, for the "Update Progress" sheet. */
export function useScheduleProgress(activityId: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ScheduleProgressEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!activityId) {
      setEntries([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    scheduleAdapter
      .listProgress(activityId)
      .then((res) => {
        if (cancelled) return;
        setEntries(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load progress history. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [activityId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, entries, refetch };
}

/**
 * Progress history for every given activity id, returned as a
 * `Map<activityId, ScheduleProgressEntry[]>` — backs the schedule table's
 * progress column and the Gantt chart's bar fills, which both need every
 * visible activity's latest reading at once rather than fetching per row.
 *
 * **Fixed in the post-Part-20 stabilization pass (Phase 3)**: this used to
 * call `scheduleAdapter.listProgress(id)` once per activity via
 * `Promise.all` — an N+1 pattern that's free against an in-memory mock but
 * would be N real HTTP round-trips against a backend. Now issues exactly
 * one call to `scheduleAdapter.listProgressForActivities`, which returns the
 * same `Map` shape in one round trip — no downstream consumer needed to
 * change.
 */
export function useScheduleProgressMap(activityIds: string[]) {
  const [status, setStatus] = useState<Status>("idle");
  const [map, setMap] = useState<Map<string, ScheduleProgressEntry[]>>(new Map());
  const [reloadToken, setReloadToken] = useState(0);
  const idsKey = activityIds.join(",");

  useEffect(() => {
    if (activityIds.length === 0) {
      setMap(new Map());
      setStatus("success");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    scheduleAdapter
      .listProgressForActivities(activityIds)
      .then((result) => {
        if (cancelled) return;
        setMap(result);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, map, refetch };
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

export function useCreateScheduleActivity() {
  return useMutation((input: CreateScheduleActivityInput, actor: ScheduleActor) => scheduleAdapter.create(input, actor));
}

export function useUpdateScheduleActivity() {
  return useMutation((id: string, patch: UpdateScheduleActivityInput, actor: ScheduleActor) =>
    scheduleAdapter.update(id, patch, actor),
  );
}

export function useAddScheduleProgress() {
  return useMutation((activityId: string, input: CreateScheduleProgressInput, actor: ScheduleActor) =>
    scheduleAdapter.addProgress(activityId, input, actor),
  );
}

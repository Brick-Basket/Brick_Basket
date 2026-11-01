"use client";

import { useEffect, useState } from "react";
import { scheduleAdapter } from "@/lib/api/adapters/schedule-adapter";
import { computeScheduleBasedProgress, type ScheduleBasedProgress } from "@/lib/utils/project-progress";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Loads a project's Schedule activities (Part 13) plus their progress logs
 * and reduces them to a single duration-weighted completion suggestion —
 * see `computeScheduleBasedProgress`'s doc comment in `project-progress.ts`
 * for the formula and why it's duration-weighted rather than cost-weighted.
 *
 * `result` is `null` once `status` settles to `"success"` when the project
 * has no Schedule activities at all (e.g. `proj_commercial_complex` in the
 * seed data) — the caller falls back to pure manual entry in that case,
 * same as before this pass.
 */
export function useScheduleBasedProgress(projectId: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ScheduleBasedProgress | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!projectId) {
      setResult(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    scheduleAdapter
      .list({ projectId, pageSize: 500 })
      .then(async (listResult) => {
        const activityIds = listResult.items.map((a) => a.id);
        const progressMap = await scheduleAdapter.listProgressForActivities(activityIds);
        if (cancelled) return;
        setResult(computeScheduleBasedProgress(listResult.items, progressMap));
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadToken]);

  const refetch = () => setReloadToken((t) => t + 1);

  return { status, result, refetch };
}

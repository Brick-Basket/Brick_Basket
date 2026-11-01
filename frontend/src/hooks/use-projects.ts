"use client";

import { useCallback, useEffect, useState } from "react";
import { projectsAdapter, type ProjectActor } from "@/lib/api/adapters/projects-adapter";
import type { Project, UpdateProjectInput } from "@/types/domain/project";
import type { ProjectProgressLogEntry } from "@/types/domain/project-progress-log";

type Status = "idle" | "loading" | "success" | "error";

/**
 * Project list lookup — replaces a direct `import { mockProjects } from
 * "@/data/mock/projects"` in a component. See `projects-adapter.ts` for why
 * this hook exists and what's still outstanding.
 */
export function useProjects(params: { customerId?: string } = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  // UI FIX (broad audit pass): every other list-fetching hook in this app
  // (useLeads, useContracts, useVendors, ...) tracks a reloadToken/refetch —
  // this was the one outlier, so `/dashboard/projects`'s error state had no
  // way to wire a Retry button (see that page's ErrorState call, and
  // use-project.ts's own `useProject` just below, which already does this).
  const [reloadToken, setReloadToken] = useState(0);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    projectsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setProjects(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load projects. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, projects, refetch };
}

/** Single-project lookup (by id), for a detail header or a name resolver. */
export function useProject(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setProject(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    projectsAdapter
      .get(id)
      .then((res) => {
        if (cancelled) return;
        setProject(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this project. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, project, refetch };
}

/**
 * Mutation hook for `ProjectsAdapter.update` — currently only
 * `progressPercentage` is editable (see `UpdateProjectInput`). Added in the
 * Customer Module pass for the per-project progress editor on the Customer
 * detail page.
 *
 * `actor` is required (robust progress mapping follow-up) so every write
 * can be attributed in `ProjectProgressLogEntry` — the one call site
 * (`CustomerProjectProgress`) sources it from `useSession()`, same pattern
 * as `CustomerForm`.
 */
export function useUpdateProjectProgress() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (id: string, patch: UpdateProjectInput, actor: ProjectActor) => {
    setStatus("loading");
    setError(null);
    try {
      const result = await projectsAdapter.update(id, patch, actor);
      setStatus("success");
      return result;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not update project progress. Please try again.");
      return null;
    }
  }, []);

  return { submit, status, error };
}

/**
 * This project's `progressPercentage` audit trail — backs the "History"
 * disclosure on the Customer Module's progress editor (robust progress
 * mapping follow-up). `refetch` lets the caller force a reload right after
 * a successful `useUpdateProjectProgress().submit` so the new entry shows
 * up without a full page reload.
 */
export function useProjectProgressLog(projectId: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [entries, setEntries] = useState<ProjectProgressLogEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!projectId) {
      setEntries([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    projectsAdapter
      .listProgressLog(projectId)
      .then((res) => {
        if (cancelled) return;
        setEntries(res);
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

  return { status, entries, refetch };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { projectsAdapter } from "@/lib/api/adapters/projects-adapter";
import type { Project } from "@/types/domain/project";

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
  }, [paramsKey]);

  return { status, error, projects };
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

"use client";

import * as React from "react";
import type { Project } from "@/types/domain/project";
import { useSession } from "@/components/providers/auth-provider";
import { useProjects } from "@/hooks/use-projects";

interface ProjectContextValue {
  projects: Project[];
  selected: Project | null;
  setSelectedId: (id: string) => void;
}

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

/**
 * BrickBasket "Project Management Navigation and Persistent Project
 * Selection" correction: the selected project id is now persisted to
 * `localStorage`, keyed per signed-in user (see `storageKeyFor` below), so
 * it survives navigation *and* a page refresh — previously this was plain
 * `useState`, reset to nothing on every reload, which is part of why
 * Schedule, DPR and Site Updates each grew their own disconnected,
 * repeat-every-time project filter instead of relying on this context.
 *
 * This is a UI convenience only, never an authorization mechanism: the id
 * read back from storage is always re-validated against `projects` below
 * before it's trusted — the same membership check this provider already
 * ran for its original "pick the first project" fallback. An id that
 * doesn't resolve to a real, role-visible project (deleted, reassigned, or
 * left over from a different account that previously used this browser)
 * is treated exactly like no selection at all, never as proof of access.
 */
function storageKeyFor(userId: string) {
  return `bb_selected_project_id:${userId}`;
}

/**
 * Scopes the project list to the signed-in user: a `customer` sees only
 * their own project(s); staff roles see all projects. Routed through
 * `useProjects` (→ `projectsAdapter`), not a direct `mockProjects` import —
 * BrickBasket final hardening pass, P2 mock import cleanup. See
 * `projects-adapter.ts` for the mock-vs-backend note.
 */
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const [selectedId, setSelectedIdState] = React.useState<string | null>(null);
  // True once the one-time localStorage restore below has run for the
  // current session — gates the validation effect further down so it
  // never fires (and overwrites a just-restored id with the "first
  // project" fallback) before the restore has had its turn.
  const [restoredFromStorage, setRestoredFromStorage] = React.useState(false);
  const { projects: allProjects, status: projectsStatus } = useProjects();

  const projects = React.useMemo(() => {
    if (!session) return [];
    if (session.user.roles.includes("customer")) {
      return allProjects.filter((p) => p.customerId === session.user.id || !p.customerId);
    }
    return allProjects;
  }, [session, allProjects]);

  // One-time restore per signed-in user. Re-runs if `session.user.id`
  // changes (a different account signs in on the same browser), so the
  // new account never inherits the previous one's stored project.
  React.useEffect(() => {
    setRestoredFromStorage(false);
    if (!session) return;
    try {
      const stored = window.localStorage.getItem(storageKeyFor(session.user.id));
      if (stored) setSelectedIdState(stored);
    } catch {
      // localStorage unavailable (private browsing, disabled storage) —
      // fall through to the ordinary "pick the first project" default below.
    }
    setRestoredFromStorage(true);
  }, [session]);

  const setSelectedId = React.useCallback(
    (id: string) => {
      setSelectedIdState(id);
      if (!session) return;
      try {
        window.localStorage.setItem(storageKeyFor(session.user.id), id);
      } catch {
        // Best-effort persistence only — the selection still works for the
        // rest of this session even if it can't be written to storage.
      }
    },
    [session],
  );

  // Validates the current selection (restored-from-storage or not)
  // against the live, role-scoped project list. A project that doesn't
  // exist, was removed, or the user can no longer access is cleared and
  // replaced with the first available project — the same fallback this
  // provider always had, now also reached when a *stored* id turns out to
  // be stale.
  //
  // BUG FIX (persisted selection lost on every reload): this used to key
  // off `projects.length === 0` to mean "the user has no accessible
  // projects, clear the selection" — but `projects` is *also* `[]` for the
  // one or two renders right after a fresh page load, before `useProjects`'
  // own fetch (`projectsAdapter.list`, always async, even against the mock
  // adapter) has resolved. On a full reload, the restore-from-storage
  // effect above (keyed only on `session`, which settles faster than the
  // project list) was routinely setting `restoredFromStorage: true` and a
  // real restored `selectedId` while `projects` was still this transient
  // `[]` — which this effect read as "no projects exist", wiping the just
  // -restored id (and deleting it from localStorage) before the real list
  // ever arrived. The *next* render, once `projects` actually populated,
  // then fell back to `projects[0]` because `selectedId` had just been
  // zeroed out — so the persisted selection silently reverted to "first
  // project in the list" on every reload, contradicting this file's own
  // "survives navigation and a page refresh" doc comment above. Gating on
  // `projectsStatus === "success"` means this effect only ever judges the
  // selection once the project list has genuinely finished loading —
  // never against the empty array that only means "still fetching."
  React.useEffect(() => {
    if (!restoredFromStorage) return;
    if (projectsStatus !== "success") return;
    if (projects.length > 0 && !projects.some((p) => p.id === selectedId)) {
      setSelectedId(projects[0]!.id);
    }
    if (projects.length === 0 && selectedId !== null) {
      setSelectedIdState(null);
      if (session) {
        try {
          window.localStorage.removeItem(storageKeyFor(session.user.id));
        } catch {
          // best-effort
        }
      }
    }
  }, [projects, projectsStatus, selectedId, restoredFromStorage, session, setSelectedId]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  // BUG FIX: this used to be a fresh `{ projects, selected, setSelectedId }`
  // object literal on every render — even on renders where none of those
  // three actually changed — which meant every `useProjectContext()`
  // consumer across the app re-rendered on every `ProjectProvider`
  // re-render, not just the ones that mattered. One concrete symptom this
  // caused: `ProjectSelector`'s open dropdown kept re-focusing its
  // selected option on these spurious re-renders, which snapped the
  // list's scroll position back and made it impossible to scroll above the
  // selected project (see that file's own fix). `useMemo` here means the
  // context value itself only changes when one of its three fields
  // actually does.
  const value = React.useMemo(() => ({ projects, selected, setSelectedId }), [projects, selected, setSelectedId]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within <ProjectProvider>");
  return ctx;
}

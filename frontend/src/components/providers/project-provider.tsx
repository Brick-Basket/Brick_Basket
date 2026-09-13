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
 * Scopes the project list to the signed-in user: a `customer` sees only
 * their own project(s); staff roles see all projects. Routed through
 * `useProjects` (→ `projectsAdapter`), not a direct `mockProjects` import —
 * BrickBasket final hardening pass, P2 mock import cleanup. See
 * `projects-adapter.ts` for the mock-vs-backend note.
 */
export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const { projects: allProjects } = useProjects();

  const projects = React.useMemo(() => {
    if (!session) return [];
    if (session.user.roles.includes("customer")) {
      return allProjects.filter((p) => p.customerId === session.user.id || !p.customerId);
    }
    return allProjects;
  }, [session, allProjects]);

  React.useEffect(() => {
    if (projects.length > 0 && !projects.some((p) => p.id === selectedId)) {
      setSelectedId(projects[0]!.id);
    }
    if (projects.length === 0) setSelectedId(null);
  }, [projects, selectedId]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  return (
    <ProjectContext.Provider value={{ projects, selected, setSelectedId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within <ProjectProvider>");
  return ctx;
}

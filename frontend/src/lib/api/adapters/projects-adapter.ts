import type { Project, UpdateProjectInput } from "@/types/domain/project";
import type { ProjectProgressLogEntry } from "@/types/domain/project-progress-log";
import { mockProjects } from "@/data/mock/projects";

/**
 * Adapter boundary for the (currently minimal) Project entity.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 10): `Project` has existed since Part 3 as `src/data/mock/projects.ts`
 * with **no adapter of its own anywhere in this app** — every module that
 * needs a project list or a project-name lookup (leads, contracts,
 * vendors, ACE, requisitions, RFQ, PO, stores, MRC, schedule, DPR, finance
 * — 69 call sites at last count, see docs/OPEN_QUESTIONS.md #44) imported
 * `mockProjects` directly, a straightforward violation of this app's own
 * `Component → hook → adapter` boundary (`docs/ARCHITECTURE.md` section G).
 * This adapter (+ `useProjects()`/`useProject()` in `src/hooks/use-projects.ts`)
 * is the missing seam: it was intentionally read-only and list-only at the
 * time — nothing in this app created/edited a `Project`.
 *
 * `update()` added in the Customer Module pass — deliberately narrow (see
 * `UpdateProjectInput` in `types/domain/project.ts`): only
 * `progressPercentage` is editable through this app today, from the
 * Customer detail screen. This is a flagged, intentional override of the
 * prior "read-only" design decision above, not a silent scope creep — a
 * full CRUD interface for `Project` is still not warranted; this is one
 * field, for one real, owner-requested use case.
 *
 * `update()` now takes an `actor` and `listProgressLog()` is new — both
 * added in the "robust progress mapping" follow-up pass (see
 * `project-progress.ts`'s header comment and docs/OPEN_QUESTIONS.md): every
 * change to `progressPercentage` is logged (who, when, previous → new
 * value, source, optional reason) so the Customer Module's progress figure
 * is always explainable, not just a bare number. The log is in-memory only
 * on this mock adapter, same caveat as every other mock adapter here.
 *
 * Backend contract — see docs/API_CONTRACTS.md:
 *   GET    /api/projects                      — list (optionally customer-scoped)
 *   GET    /api/projects/:id                   — detail
 *   PATCH  /api/projects/:id                   — edit progressPercentage (customers:write) — a real backend should write the audit-log entry server-side, transactionally, as part of this same request
 *   GET    /api/projects/:id/progress-log      — this project's progressPercentage audit trail (customers:read)
 *
 * Migrating the 69 existing `mockProjects` import sites onto this hook is
 * tracked as a scoped follow-up (docs/OPEN_QUESTIONS.md #44) — not done in
 * this pass for every call site, since a blind mechanical edit across ~70
 * files with no `tsc`/build available in this sandbox to verify the result
 * would be a bigger risk than the violation it fixes. A representative
 * sample was migrated (see the CHANGELOG entry for this pass) to prove the
 * pattern for the remaining sites.
 */
export interface ProjectActor {
  id: string;
  name: string;
}

export interface ProjectsAdapter {
  list(params?: { customerId?: string }): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  update(id: string, patch: UpdateProjectInput, actor: ProjectActor): Promise<Project>;
  /** This project's `progressPercentage` audit trail, newest first. */
  listProgressLog(projectId: string): Promise<ProjectProgressLogEntry[]>;
}

class MockProjectsAdapter implements ProjectsAdapter {
  private projects: Project[] = [...mockProjects];
  private progressLog: ProjectProgressLogEntry[] = [];

  async list(params: { customerId?: string } = {}): Promise<Project[]> {
    await delay(150);
    if (!params.customerId) return [...this.projects];
    return this.projects.filter((p) => p.customerId === params.customerId);
  }

  async get(id: string): Promise<Project | null> {
    await delay(150);
    return this.projects.find((p) => p.id === id) ?? null;
  }

  async update(id: string, patch: UpdateProjectInput, actor: ProjectActor): Promise<Project> {
    await delay(300);
    const project = this.mustFind(id);
    const { source, reason, ...fields } = patch;
    const updated: Project = { ...project, ...fields };
    this.projects = this.projects.map((p) => (p.id === updated.id ? updated : p));

    // Only log a real change — a save that doesn't actually move
    // `progressPercentage` (e.g. hitting Save without editing the value)
    // isn't a change worth an audit-trail entry.
    if (fields.progressPercentage !== undefined && fields.progressPercentage !== project.progressPercentage) {
      const entry: ProjectProgressLogEntry = {
        id: `plog_${Math.random().toString(36).slice(2, 10)}`,
        projectId: id,
        previousPercentage: project.progressPercentage ?? null,
        newPercentage: fields.progressPercentage,
        source: source ?? "manual",
        reason,
        changedBy: actor.id,
        changedByName: actor.name,
        changedAt: new Date().toISOString(),
      };
      this.progressLog = [entry, ...this.progressLog];
    }

    return updated;
  }

  async listProgressLog(projectId: string): Promise<ProjectProgressLogEntry[]> {
    await delay(150);
    // Already newest-first — every entry is unshifted onto the front in
    // `update()` above, so no re-sort needed here.
    return this.progressLog.filter((e) => e.projectId === projectId);
  }

  private mustFind(id: string): Project {
    const project = this.projects.find((p) => p.id === id);
    if (!project) throw new Error("Project not found.");
    return project;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const projectsAdapter: ProjectsAdapter = new MockProjectsAdapter();

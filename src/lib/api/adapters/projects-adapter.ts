import type { Project } from "@/types/domain/project";
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
 * is the missing seam: it is intentionally read-only and list-only for now
 * — nothing in this app creates/edits a `Project` yet, so a full CRUD
 * interface would be invented surface area, not a real gap — and mirrors
 * this app's existing lightweight read-only adapters (`CostToCompleteAdapter`
 * et al.) rather than the heavier `list/get/create/update` shape used by
 * entities that actually have a form.
 *
 * Backend contract — see docs/API_CONTRACTS.md:
 *   GET /api/projects        — list (optionally customer-scoped)
 *   GET /api/projects/:id    — detail
 *
 * Migrating the 69 existing `mockProjects` import sites onto this hook is
 * tracked as a scoped follow-up (docs/OPEN_QUESTIONS.md #44) — not done in
 * this pass for every call site, since a blind mechanical edit across ~70
 * files with no `tsc`/build available in this sandbox to verify the result
 * would be a bigger risk than the violation it fixes. A representative
 * sample was migrated (see the CHANGELOG entry for this pass) to prove the
 * pattern for the remaining sites.
 */
export interface ProjectsAdapter {
  list(params?: { customerId?: string }): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
}

class MockProjectsAdapter implements ProjectsAdapter {
  private projects: Project[] = [...mockProjects];

  async list(params: { customerId?: string } = {}): Promise<Project[]> {
    await delay(150);
    if (!params.customerId) return [...this.projects];
    return this.projects.filter((p) => p.customerId === params.customerId);
  }

  async get(id: string): Promise<Project | null> {
    await delay(150);
    return this.projects.find((p) => p.id === id) ?? null;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const projectsAdapter: ProjectsAdapter = new MockProjectsAdapter();

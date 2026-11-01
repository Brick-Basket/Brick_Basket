import { AuthGuard } from "@/components/shell/auth-guard";
import { ProjectProvider } from "@/components/providers/project-provider";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import { STAFF_ROLES } from "@/lib/permissions/permissions";

/**
 * FRONTEND IMPLEMENTATION DECISION (originally this pass, see
 * docs/OPEN_QUESTIONS.md #62; updated by the "Project Management
 * Navigation and Persistent Project Selection" correction; updated again
 * by the "Global Project Selector" correction):
 *
 * This global topbar `ProjectSelector` was turned OFF here for a long
 * stretch (see docs/CHANGELOG.md) because, at the time, an audit of every
 * admin page/adapter found zero real `useProjectContext()` reads outside
 * Schedule/DPR/Site Updates — showing a global selector above the many
 * still-disconnected modules (ACE, Supply/Service Requirement, RFQs,
 * Purchase Orders, GRN, Material Requisitions (MR), Stock Statement,
 * Wastage, Material Receipts, Project Cost, Cost-to-Complete) would have
 * been non-functional UI above them, and redundant above the three that
 * already had their own project control.
 *
 * The "Global Project Selector" correction closed that gap: all eleven of
 * those modules' own project filters now read the current selection on
 * first load and write back to it when a specific project is picked
 * (never on "All projects" — see each `*-filters.tsx`'s own comment),
 * the same `ProjectProvider`/`useProjectContext` mechanism Schedule, DPR
 * and Site Updates already used. With every project-aware admin module
 * now actually wired to this shared state, the global topbar control is
 * switched back on: it is the one place to see and change "which project
 * am I looking at" without having to be on a specific module's page
 * first, and every module's own in-page control stays exactly where it
 * was, now just reading/writing the same shared selection instead of its
 * own disconnected one. Nothing about per-page filtering, pagination,
 * sorting, search, or any non-project filter changed. See
 * docs/CHANGELOG.md for the full module list and docs/OPEN_QUESTIONS.md
 * for the open question this correction resolves.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={STAFF_ROLES}>
      <ProjectProvider>
        <AppShell
          variant="admin"
          homeHref={ADMIN_ROUTES.home}
          homeLabel="Operations"
        >
          {children}
        </AppShell>
      </ProjectProvider>
    </AuthGuard>
  );
}

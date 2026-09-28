import { AuthGuard } from "@/components/shell/auth-guard";
import { ProjectProvider } from "@/components/providers/project-provider";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import { STAFF_ROLES } from "@/lib/permissions/permissions";

/**
 * FRONTEND IMPLEMENTATION DECISION (this pass, see docs/OPEN_QUESTIONS.md
 * #62): the global topbar `ProjectSelector` used to render on every
 * `/admin/*` page via `AppShell`'s `showProjectSelector ?? true` default.
 * Audited every admin page/adapter for a real `useProjectContext()` read
 * and found none — zero. Every module that actually needs one project at a
 * time (Schedule, DPR, Cost to Complete, MRC, GRN, Wastage, Stock,
 * Purchase Orders, RFQ, Requisitions, Store Requisitions, GSTR, Fixed
 * Assets, Tax Records, Bank, Payments, Invoices, ACE) already has its own
 * dedicated, clearly-labeled, *required* project filter built into that
 * module's own page (e.g. `ScheduleFilters`) — a deliberate per-module
 * choice made as each shipped (see docs/WORKFLOWS.md), never wired back to
 * this shared one. The Dashboard's metrics are explicitly cross-project.
 * So in Admin this control never changed anything on any screen — which is
 * exactly what the "no one is understanding why Commercial
 * Complex/Luxury Villa is showing" report was catching. Turning it off
 * here removes the confusing, non-functional control; it stays on for
 * the customer Portal, where `/dashboard/documents` genuinely reads it.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={STAFF_ROLES}>
      <ProjectProvider>
        <AppShell
          variant="admin"
          homeHref={ADMIN_ROUTES.home}
          homeLabel="Operations"
          showProjectSelector={false}
        >
          {children}
        </AppShell>
      </ProjectProvider>
    </AuthGuard>
  );
}

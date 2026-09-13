import { AuthGuard } from "@/components/shell/auth-guard";
import { ProjectProvider } from "@/components/providers/project-provider";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import { STAFF_ROLES } from "@/lib/permissions/permissions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={STAFF_ROLES}>
      <ProjectProvider>
        <AppShell variant="admin" homeHref={ADMIN_ROUTES.home} homeLabel="Operations">
          {children}
        </AppShell>
      </ProjectProvider>
    </AuthGuard>
  );
}

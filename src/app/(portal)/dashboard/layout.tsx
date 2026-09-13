import { AuthGuard } from "@/components/shell/auth-guard";
import { ProjectProvider } from "@/components/providers/project-provider";
import { AppShell } from "@/components/shell/app-shell";
import { PORTAL_ROUTES } from "@/lib/constants/routes";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["customer"]}>
      <ProjectProvider>
        <AppShell
          variant="portal"
          homeHref={PORTAL_ROUTES.home}
          homeLabel="Portal"
          profileHref={PORTAL_ROUTES.profile}
        >
          {children}
        </AppShell>
      </ProjectProvider>
    </AuthGuard>
  );
}

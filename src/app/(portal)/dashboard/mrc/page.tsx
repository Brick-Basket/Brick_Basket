"use client";

import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { StatusBadge } from "@/components/domain/status-badge";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useCustomerId } from "@/hooks/use-customer-id";
import { useMRCs } from "@/hooks/use-mrc";
import { useProjects } from "@/hooks/use-projects";
import { MRC_STATUS_CONFIG } from "@/components/mrc/mrc-status-config";
import { formatDate } from "@/lib/utils/format";
import { PORTAL_ROUTES } from "@/lib/constants/routes";

export default function MyMRCsPage() {
  return (
    <PermissionGuard
      permission="mrc:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Material Receipt Certificates" />
        </div>
      }
    >
      <MyMRCsContent />
    </PermissionGuard>
  );
}

function MyMRCsContent() {
  const router = useRouter();
  // See `useCustomerId` — an unguarded `session?.user.id` would list every
  // customer's MRCs, not just this one's, while the session is still
  // resolving. See docs/OPEN_QUESTIONS.md #47.
  const customerId = useCustomerId();
  const { status, error, result, refetch } = useMRCs({
    customerId,
    pageSize: 50,
    sortBy: "updatedAt",
    sortDir: "desc",
  });
  // Looked up per-card below (`project.name`) — kept as one list call
  // rather than a `useProject(id)` call inside `.map()`, which would
  // violate the Rules of Hooks (a hook can't be called a variable number
  // of times per render). See docs/OPEN_QUESTIONS.md #44.
  const { projects } = useProjects({ customerId });

  // Drafts are never shown to the customer yet — filtered client-side as a
  // frontend safeguard, mirroring Contract's "My Contracts" page (Part 5);
  // the real backend's customer-facing endpoint must never return draft
  // MRCs in the first place. See docs/WORKFLOWS.md.
  const visibleMrcs = (result?.items ?? []).filter((m) => m.status !== "draft");

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">My Material Receipt Certificates</h1>
        <p className="text-sm text-ink-muted">Review and respond to certificates BrickBasket has issued you.</p>
      </div>

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-28 w-full" />
          <LoadingSkeleton className="h-28 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load your MRCs" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && visibleMrcs.length === 0 && (
        <EmptyState
          icon={ClipboardCheck}
          title="No certificates yet"
          description="Material Receipt Certificates BrickBasket issues you will appear here."
        />
      )}

      {status === "success" && visibleMrcs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleMrcs.map((mrc) => {
            const project = mrc.projectId ? projects.find((p) => p.id === mrc.projectId) : null;
            return (
              <Card
                key={mrc.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`${PORTAL_ROUTES.mrc}/${mrc.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{mrc.mrcNumber}</CardTitle>
                    <StatusBadge status={mrc.status} config={MRC_STATUS_CONFIG} />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm text-ink-muted">
                  {project && <p>{project.name}</p>}
                  <p>Updated {formatDate(mrc.updatedAt)}</p>
                  {mrc.status === "issued" && <p className="mt-1 font-medium text-brand-red">Awaiting your response</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { FileText, PackageCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { useCustomerId } from "@/hooks/use-customer-id";
import { useProjects } from "@/hooks/use-projects";
import { PORTAL_ROUTES } from "@/lib/constants/routes";

/**
 * `/dashboard/projects` — implemented (post-Part-20 stabilization pass,
 * Phase 9; was a Part-3 scaffolded placeholder). Lists every project
 * linked to this customer (`Project.customerId === session.user.id`, the
 * same convention Portal Home's "My Projects" section, `/dashboard/contracts`,
 * etc. already use — see `docs/DATA_MODELS.md`).
 *
 * FRONTEND IMPLEMENTATION DECISION: `Project` (`src/types/domain/project.ts`)
 * is deliberately a minimal shape — `id`, `name`, `location`, optional
 * `customerId` — with no `status` field and nothing else confirmed by the
 * owner requirements. Rather than invent a status, progress percentage, or
 * any other field with no backing data, this page shows exactly what
 * `Project` actually has, plus links into the two portal modules that are
 * genuinely project-relevant today (Contracts, MRC) — real navigation, not
 * a fabricated "project summary" widget. Extend this page the moment
 * `Project` grows real fields (see the header comment in `project.ts`).
 */
export default function Page() {
  // See `useCustomerId` — every customer-scoped list hook in the portal
  // goes through it so this guard lives in one place. See
  // docs/OPEN_QUESTIONS.md #47.
  const customerId = useCustomerId();
  const { status, error, projects } = useProjects({ customerId });

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">My Projects</h1>
        <p className="text-sm text-ink-muted">Every project linked to your account.</p>
      </div>

      {status === "loading" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <LoadingSkeleton className="h-32 w-full" />
          <LoadingSkeleton className="h-32 w-full" />
        </div>
      ) : status === "error" ? (
        <ErrorState title="Could not load your projects" description={error ?? undefined} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects linked to your account yet"
          description="Contact BrickBasket if you believe this is a mistake."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col gap-4 p-5">
              <div>
                <p className="font-heading text-base font-semibold text-ink">{project.name}</p>
                <p className="mt-1 text-sm text-ink-muted">{project.location}</p>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Link
                  href={PORTAL_ROUTES.contracts}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted"
                >
                  <FileText className="h-3.5 w-3.5" aria-hidden />
                  Contracts
                </Link>
                <Link
                  href={PORTAL_ROUTES.mrc}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-muted"
                >
                  <PackageCheck className="h-3.5 w-3.5" aria-hidden />
                  MRCs
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

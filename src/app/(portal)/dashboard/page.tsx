"use client";

import Link from "next/link";
import { FileText, FolderOpen, PackageCheck, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { EmptyState } from "@/components/domain/empty-state";
import { NotificationList } from "@/components/notifications/notification-list";
import { useSession } from "@/components/providers/auth-provider";
import { useCustomerId } from "@/hooks/use-customer-id";
import { useNotifications } from "@/hooks/use-notifications";
import { useProjects } from "@/hooks/use-projects";
import { PORTAL_ROUTES } from "@/lib/constants/routes";

const QUICK_LINKS = [
  { label: "Contracts", href: PORTAL_ROUTES.contracts, icon: FileText },
  { label: "Documents", href: PORTAL_ROUTES.documents, icon: FolderOpen },
  { label: "Material Receipt Certificates", href: PORTAL_ROUTES.mrc, icon: PackageCheck },
  { label: "Payments", href: PORTAL_ROUTES.payments, icon: Wallet },
];

/**
 * Portal Home (Part 3 route, real content Part 19) — a greeting, this
 * customer's projects (`Project.customerId === session.user.id`, the same
 * convention `/dashboard/contracts` etc. already use, see
 * `docs/DATA_MODELS.md`'s "no separate Customer-id mapping table" note),
 * a notifications summary sharing `useNotifications()` with the Topbar
 * bell/`/dashboard/notifications`, and quick links to the rest of the
 * portal.
 */
export default function Page() {
  const { session } = useSession();
  const { status, notifications } = useNotifications();
  // See `useCustomerId` — every customer-scoped list hook in the portal
  // goes through it so this guard lives in one place. See
  // docs/OPEN_QUESTIONS.md #47.
  const customerId = useCustomerId();
  const { projects: myProjects } = useProjects({ customerId });

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">
          {session ? `Welcome back, ${session.user.name.split(" ")[0]}` : "Portal Home"}
        </h1>
        <p className="text-sm text-ink-muted">Your projects, notifications, and quick links, all in one place.</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">My Projects</h2>
        {myProjects.length === 0 ? (
          <EmptyState title="No projects linked to your account yet" description="Contact BrickBasket if you believe this is a mistake." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {myProjects.map((project) => (
              <Card key={project.id} className="p-5">
                <p className="font-heading text-base font-semibold text-ink">{project.name}</p>
                <p className="mt-1 text-sm text-ink-muted">{project.location}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold text-ink">Notifications</h2>
          <Link href={PORTAL_ROUTES.notifications} className="text-sm font-medium text-brand-red hover:underline">
            See all
          </Link>
        </div>
        {status === "loading" ? (
          <LoadingSkeleton className="h-16 w-full" />
        ) : (
          <NotificationList
            notifications={notifications.slice(0, 5)}
            emptyDescription="Nothing needs your attention right now."
          />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
            >
              <Card className="flex items-center gap-3 p-5 hover:border-ink-muted">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-muted">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <p className="text-sm font-medium text-ink">{label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

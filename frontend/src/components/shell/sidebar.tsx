"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { usePermission } from "@/lib/permissions/use-permission";
import type { NavGroup } from "@/components/shell/nav-config";
import { cn } from "@/lib/utils/cn";

function NavLink({ item }: { item: NavGroup["items"][number] }) {
  const pathname = usePathname();
  const allowed = usePermission(item.permission);
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  if (!allowed) return null;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-red text-white" : "text-white/75 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

/**
 * Shared nav list markup — rendered once for the fixed desktop aside and
 * once inside the mobile drawer (AppShell), so the two never drift apart.
 */
export function NavList({ groups }: { groups: NavGroup[] }) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Primary">
      {groups.map((group, i) => (
        <div key={group.label ?? i}>
          {group.label && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              {group.label}
            </p>
          )}
          <div className="flex flex-col gap-1">
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ groups, homeHref }: { groups: NavGroup[]; homeHref: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-brand-charcoal px-4 py-6 md:flex">
      <Link href={homeHref} className="px-3">
        <Logo variant="dark" size="sm" />
      </Link>
      <div className="mt-8 flex-1 overflow-y-auto">
        <NavList groups={groups} />
      </div>
    </aside>
  );
}

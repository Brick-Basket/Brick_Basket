"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { useSession } from "@/components/providers/auth-provider";
import { useClickOutside } from "@/hooks/use-click-outside";
import { PUBLIC_ROUTES } from "@/lib/constants/routes";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  customer: "Customer",
  project_manager: "Project Manager",
  site_engineer: "Site Engineer",
  purchaser: "Purchaser",
  store_personnel: "Store Personnel",
  finance: "Finance",
  approver: "Approver",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ profileHref }: { profileHref?: string }) {
  const { session, logout } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  if (!session) return null;
  const { user } = session;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-surface-muted"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-red text-xs font-semibold text-white">
          {initials(user.name)}
        </span>
        <span className="hidden text-left text-sm sm:block">
          <span className="block font-medium leading-tight text-ink">{user.name}</span>
          <span className="block text-xs leading-tight text-ink-muted">
            {user.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}
          </span>
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-ink-muted sm:block" aria-hidden />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-card">
          <div className="border-b border-border px-3 py-2">
            <p className="text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          {profileHref && (
            <Link
              href={profileHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-muted"
            >
              <UserCircle className="h-4 w-4" aria-hidden />
              Profile
            </Link>
          )}
          <button
            type="button"
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push(PUBLIC_ROUTES.home);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-error/5"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { Menu } from "lucide-react";
import { ProjectSelector } from "@/components/shell/project-selector";
import { GlobalSearch } from "@/components/shell/global-search";
import { NotificationsMenu } from "@/components/shell/notifications-menu";
import { UserMenu } from "@/components/shell/user-menu";

export function Topbar({
  onMenuClick,
  showProjectSelector,
  profileHref,
}: {
  onMenuClick: () => void;
  showProjectSelector?: boolean;
  profileHref?: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        {showProjectSelector && <ProjectSelector />}
      </div>

      <div className="flex items-center gap-2">
        <GlobalSearch />
        <NotificationsMenu />
        <UserMenu profileHref={profileHref} />
      </div>
    </header>
  );
}

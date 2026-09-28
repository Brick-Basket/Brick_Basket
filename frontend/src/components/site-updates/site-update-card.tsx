"use client";

import { Calendar, EyeOff, Hammer } from "lucide-react";
import { SiteUpdateMediaGrid } from "@/components/site-updates/site-update-media-grid";
import { formatDate } from "@/lib/utils/format";
import type { SiteUpdate } from "@/types/domain/site-update";

/**
 * One card in the Site Updates feed. A card feed (not `DataTable`, unlike
 * every other list screen in the app) is a deliberate choice: this module's
 * whole point is photos/videos, which a data-grid row can't show well —
 * see docs/CHANGELOG.md.
 */
export function SiteUpdateCard({
  update,
  showVisibilityBadge = false,
  onClick,
}: {
  update: SiteUpdate;
  /** Admin/staff views only — the customer feed is already filtered to visible-only, so the badge would be redundant there. */
  showVisibilityBadge?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-3 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-brand-red/40 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          <Calendar className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
          {formatDate(update.updateDate)}
        </span>
        {showVisibilityBadge && !update.visibleToCustomer && (
          <span className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
            <EyeOff className="h-3 w-3" aria-hidden />
            Not visible to customer
          </span>
        )}
      </div>

      <SiteUpdateMediaGrid media={update.media} compact />

      <p className="line-clamp-2 text-sm text-ink">{update.remarks}</p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
        {update.relatedWorkItem ? (
          <span className="flex items-center gap-1">
            <Hammer className="h-3 w-3" aria-hidden />
            {update.relatedWorkItem}
          </span>
        ) : (
          <span />
        )}
        <span>Posted by {update.postedByName}</span>
      </div>
    </button>
  );
}

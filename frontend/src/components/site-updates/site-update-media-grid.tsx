"use client";

import { FileQuestion, PlayCircle } from "lucide-react";
import { siteUpdatesAdapter } from "@/lib/api/adapters/site-updates-adapter";
import type { SiteUpdateMedia } from "@/types/domain/site-update";
import { cn } from "@/lib/utils/cn";

/**
 * Renders one `SiteUpdate`'s photos/videos as a responsive tile grid.
 * Mirrors `DocumentPreviewArea`'s file-type branching (image → `<img>`,
 * otherwise a native player/fallback) but for N media items instead of one.
 * A tile with no in-memory object URL (every seeded demo record, and any
 * real record after a reload) shows an explicit "no file on record" state —
 * never a fake/broken preview. See docs/FILE_UPLOADS.md and
 * docs/OPEN_QUESTIONS.md for why this mock has no persistent file storage.
 */
export function SiteUpdateMediaGrid({ media, compact = false }: { media: SiteUpdateMedia[]; compact?: boolean }) {
  if (media.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-card border border-dashed border-border bg-surface-muted text-xs text-ink-muted">
        No photos or videos attached
      </div>
    );
  }

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
      {media.map((item) => (
        <SiteUpdateMediaTile key={item.id} media={item} compact={compact} />
      ))}
    </div>
  );
}

function SiteUpdateMediaTile({ media, compact }: { media: SiteUpdateMedia; compact: boolean }) {
  const previewUrl = siteUpdatesAdapter.getPreviewUrl(media.id);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-card border border-border bg-surface-muted",
        compact ? "aspect-square" : "aspect-video sm:aspect-square",
      )}
      title={media.caption ?? media.fileName}
    >
      {previewUrl && media.type === "photo" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={media.caption ?? media.fileName} className="h-full w-full object-cover" />
      )}

      {previewUrl && media.type === "video" && (
        <>
          <video src={previewUrl} className="h-full w-full object-cover" muted />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <PlayCircle className="h-8 w-8 text-white drop-shadow" aria-hidden />
          </span>
        </>
      )}

      {!previewUrl && (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
          <FileQuestion className="h-5 w-5 text-ink-muted" aria-hidden />
          <span className="text-[10px] leading-tight text-ink-muted">No file on record</span>
        </div>
      )}

      {media.type === "video" && !compact && (
        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Video
        </span>
      )}
    </div>
  );
}

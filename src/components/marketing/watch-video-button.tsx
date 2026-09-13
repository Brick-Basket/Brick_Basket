"use client";

import * as React from "react";
import { PlayCircle, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { buttonVariants } from "@/components/ui/button";

/**
 * Hero "Watch Video" button + its own lightweight video modal.
 *
 * FRONTEND IMPLEMENTATION DECISION (real video wired in): this button used
 * to link straight to `/how-it-works` under a "Watch Video" label with no
 * real video behind it anywhere in the project — briefly relabeled "How It
 * Works" to stop misleading visitors (see `docs/CHANGELOG.md`). The owner
 * has since supplied a real explainer video (Google Drive, see
 * `INTRO_VIDEO` in `src/lib/content/public-site.ts`), so this restores the
 * "Watch Video" label/icon and opens the real video in place, instead of
 * navigating away from the page.
 *
 * A dedicated modal rather than the shared `Dialog` primitive
 * (`src/components/ui/dialog.tsx`): `Dialog` is sized and padded for short
 * text content (`max-w-md`) — a video needs a wide, near-edge-to-edge
 * 16:9 box instead. This still reuses the same interaction contract
 * (`Escape` / overlay click / trapped-and-restored focus) via the same
 * `useFocusTrap` hook `Dialog` and `Sheet` use, so it behaves consistently
 * with every other overlay on the site rather than being a one-off.
 *
 * The iframe only mounts while `open` is true and unmounts on close, so the
 * video is never fetched on page load and playback stops the instant the
 * modal closes (no manual pause call needed — there's nothing to pause,
 * the element is gone).
 */
export function WatchVideoButton({ embedUrl }: { embedUrl: string }) {
  const [open, setOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  const close = React.useCallback(() => setOpen(false), []);
  useFocusTrap(open, panelRef, close);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        <PlayCircle className="h-4 w-4" aria-hidden /> Watch Video
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            aria-label="Close video"
            className="absolute inset-0 bg-black/70"
            onClick={close}
          />
          <div ref={panelRef} tabIndex={-1} className="relative w-full max-w-3xl outline-none">
            <h2 id={titleId} className="sr-only">
              BrickBasket introduction video
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-card bg-black shadow-2xl">
              <iframe
                src={embedUrl}
                title="BrickBasket introduction video"
                className="h-full w-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFocusTrap } from "@/hooks/use-focus-trap";

/**
 * Slide-over drawer from the right edge — the lead detail view (Part 4) and
 * any later "view/edit one record without leaving the list" screen renders
 * through this rather than a full route navigation. Hand-rolled (no Radix
 * dependency): a fixed overlay + panel, closed on overlay click, the close
 * button, or Escape. Locks body scroll while open; focus trapped inside the
 * panel and restored to the trigger on close (Phase 14 fix — see
 * `useFocusTrap`'s header comment).
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClassName = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  useEffect_lockScroll(open);
  useFocusTrap(open, panelRef, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <button
        type="button"
        aria-label="Close panel"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn("relative flex h-full w-full flex-col bg-surface shadow-xl outline-none", widthClassName)}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-6">
          <div>
            <h2 id={titleId} className="font-heading text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-ink-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
        {footer && <div className="border-t border-border p-6">{footer}</div>}
      </div>
    </div>
  );
}

function useEffect_lockScroll(open: boolean) {
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
}

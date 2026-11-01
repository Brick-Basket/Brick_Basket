"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";

/**
 * Centered modal — the base primitive `ConfirmationDialog` (domain layer)
 * builds on, and usable directly for any small focused interaction (a
 * short create form, a confirmation). Hand-rolled, same pattern as `Sheet`:
 * overlay click / Escape / close button all close it, body scroll locked
 * while open, focus trapped inside it and restored to the trigger on close
 * (Phase 14 fix — see `useFocusTrap`'s header comment).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  useFocusTrap(open, panelRef, onClose);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/*
       * BUG FIX (owner report: "Add Stock Entry" — after clicking "Use these
       * values" on the GRN/MR/Wastage reconciliation aid, the dialog grew
       * taller than the viewport and there was no way to reach "Supplier",
       * "Remarks", or the Cancel/Add Entry buttons at the bottom; the top of
       * the dialog, including its own title, was invisibly clipped above the
       * screen too). This panel previously had no height cap and no
       * scroll of its own — just `p-6` with everything stacked inside an
       * otherwise-unconstrained `<div>`. With the overlay centering it via
       * `items-center` on a `fixed inset-0` container, any content taller
       * than the viewport simply overflowed equally above *and* below the
       * screen, and since `Dialog` also locks `document.body`'s scroll
       * while open (a few lines up), there was no way to reach the clipped
       * content at all — not a problem unique to Stock Statement, since
       * every one of this component's 19 call sites (Stock, Wastage,
       * Schedule, Finance, Leads, PO detail, etc.) could hit the same wall
       * with a long enough form or a wide validation-error list. Capping
       * the panel at `max-h-[85vh]` and making it scroll internally
       * (`overflow-y-auto`) keeps the panel fully on-screen regardless of
       * content height, with the title, body, and footer all scrolling
       * together — the simplest fix that doesn't require every caller's
       * form to opt in individually.
       */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-y-auto rounded-card bg-surface p-6 shadow-xl outline-none"
      >
        <div className="flex items-start justify-between gap-3">
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
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

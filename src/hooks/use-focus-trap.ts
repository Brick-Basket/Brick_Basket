"use client";

import * as React from "react";

/**
 * Shared modal focus management for `Dialog` and `Sheet` (both hand-rolled,
 * no Radix dependency — see each component's own header comment).
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 14): before this fix, neither component did anything beyond Escape-to-
 * close and a body-scroll lock — a keyboard or screen-reader user opening
 * either kept focus on whatever was behind the overlay, could Tab straight
 * out of the panel into the page behind it, and never got focus back on
 * the control that opened it once it closed. This hook is the one place
 * that fixes all three, so `Dialog` and `Sheet` share the exact same
 * behavior rather than two subtly different hand-rolled copies. See
 * docs/OPEN_QUESTIONS.md #48.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.tabIndex !== -1);
}

export function useFocusTrap(
  open: boolean,
  containerRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);
  // Latest-ref, not a dependency: `onClose` is often a fresh inline arrow
  // function on every render of the caller, and re-running this effect on
  // every render would re-do "move focus into the panel" every time —
  // only `open` flipping should do that.
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const container = containerRef.current;
    const focusables = container ? getFocusableElements(container) : [];
    (focusables[0] ?? container)?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !container) return;
      const els = getFocusableElements(container);
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previouslyFocusedRef.current?.focus();
    };
    // `containerRef` is a ref object — stable identity, safe to omit its
    // `.current` from deps; re-running this effect only on `open` changing
    // is the intended behavior (see the `onCloseRef` comment above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}

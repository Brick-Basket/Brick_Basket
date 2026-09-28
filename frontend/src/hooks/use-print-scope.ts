"use client";

import { useCallback, useRef } from "react";

const ACTIVE_CLASS = "print-scope-active";

/**
 * Returns a `printElement(ref)` function that prints only one element on
 * the page — the fix for the owner correction: "only the required/
 * designated print section should include, not the whole app/website."
 * See the `.print-scope`/`.print-scope-active` rules in `src/app/globals.css`
 * for the actual print-media CSS this toggles.
 *
 * `window.print()` itself has no "print this element" mode — it always
 * prints the current page. The standard workaround is what's here: mark the
 * one element that should print with the `print-scope` class, add a
 * body-level class that activates print-only CSS hiding everything else,
 * call `window.print()`, then remove the body class once printing is done
 * (or was cancelled) via the `afterprint` event — with a timeout fallback
 * for the rare browser that doesn't fire it, so the page never gets stuck
 * with print-only styling applied to the live screen.
 */
export function usePrintScope() {
  const cleanupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const printElement = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    const el = ref.current;
    if (!el) {
      // Fallback: no ref yet (shouldn't normally happen) — still print rather than silently no-op.
      window.print();
      return;
    }

    el.classList.add("print-scope");
    document.body.classList.add(ACTIVE_CLASS);

    const cleanup = () => {
      document.body.classList.remove(ACTIVE_CLASS);
      el.classList.remove("print-scope");
      window.removeEventListener("afterprint", cleanup);
      if (cleanupTimeout.current) {
        clearTimeout(cleanupTimeout.current);
        cleanupTimeout.current = null;
      }
    };

    window.addEventListener("afterprint", cleanup);
    // Safety net — a browser that never fires `afterprint` (or a print
    // dialog the visitor leaves open a long time) shouldn't leave the page
    // permanently stuck in print-scoped CSS.
    cleanupTimeout.current = setTimeout(cleanup, 60_000);

    window.print();
  }, []);

  return { printElement };
}

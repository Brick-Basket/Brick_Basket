"use client";

import { useEffect } from "react";

/** Calls `onOutside` on any pointer-down outside `ref`'s element, and on Escape. */
export function useClickOutside(ref: React.RefObject<HTMLElement | null>, onOutside: () => void) {
  useEffect(() => {
    function handlePointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOutside();
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ref, onOutside]);
}

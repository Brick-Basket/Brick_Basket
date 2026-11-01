"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Building2, ChevronDown, Check } from "lucide-react";
import { useProjectContext } from "@/components/providers/project-provider";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils/cn";

/**
 * Scopes the current screen to one project — reads/writes ProjectContext
 * (src/components/providers/project-provider.tsx), currently backed by
 * mock data. Full wiring of "current project" into module screens happens
 * as each module ships (Part 4+); this component is the UI + state only.
 *
 * FRONTEND IMPLEMENTATION DECISION (this pass, docs/OPEN_QUESTIONS.md #62):
 * the trigger used to show only an icon + the project's name — nothing
 * said what it was a selector *of*, which is exactly what made it read as
 * mystery UI ("Commercial Complex"? "Luxury Villa"?) on the one shell
 * (Portal) that still shows it after this pass — Admin no longer renders
 * it at all, see `src/app/(internal)/admin/layout.tsx`. Added a small
 * "Project" label in front of the trigger, plus a `title` tooltip on the
 * button itself, so its purpose is legible without anyone having to ask.
 *
 * FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
 * 14): the trigger + listbox markup (`aria-expanded`/`aria-haspopup`/
 * `role="listbox"`/`role="option"`) was already correct, but nothing
 * behind it supported keyboard use — Arrow keys didn't move between
 * options, Escape didn't close the popover, and focus never moved into or
 * back out of the list. Added the standard "listbox with roving real DOM
 * focus" pattern: Arrow Down/Up (from the closed trigger or inside the
 * open list) open it and move between options, wrapping at each end;
 * Home/End jump to the first/last option; Escape closes and returns focus
 * to the trigger; opening moves focus to the selected option (or the
 * first, if none is selected yet). See docs/OPEN_QUESTIONS.md #48.
 */
export function ProjectSelector() {
  const { projects, selected, setSelectedId } = useProjectContext();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listRef = useRef<HTMLUListElement>(null);

  // BUG FIX: `containerRef` was created for exactly this (its own comment,
  // a few lines below, already referred to it as "its parent"), but the
  // actual close-on-outside-click/Escape wiring was never added — the
  // dropdown previously stayed open until a click landed on an option, Tab,
  // or a keydown while focus was already inside the open `<ul>` (handled
  // separately below). `useClickOutside` also closes on *any* Escape
  // press document-wide, so it's gated on `open` here to avoid stealing
  // focus back to this trigger on an Escape meant for something else
  // entirely (a different open dialog, etc.) while this selector happens
  // to be closed.
  useClickOutside(containerRef, () => {
    if (open) closeAndRefocusTrigger();
  });
  // BUG FIX (two parts, same underlying complaint: "I can't reach above
  // the selected one"). (1) This effect used to refire — and refocus the
  // already-focused selected option — on any render where `projects`/
  // `selected` got a new reference, not only when the list actually
  // opened, because `ProjectContext`'s Provider value used to be a fresh
  // object literal every render (now `useMemo`'d, see
  // project-provider.tsx). The guard below makes sure this effect's body
  // only actually runs once per "open" session regardless. (2) That
  // guard alone wasn't the whole story: even a single, correct
  // `.focus()` call on an option that isn't first in the list (here,
  // "Modern Residence", 3rd of 6) makes the browser apply its own
  // default scroll-into-view for that element — and for a list this
  // short, that was enough to scroll the *first* project(s) out of view
  // above it on the very first open, before the user ever touched their
  // scroll wheel. `{ preventScroll: true }` stops that implicit scroll,
  // and the list's own scroll position is then explicitly reset to the
  // top, so opening it always starts from the first project, with the
  // selected one simply marked (checked, highlighted) wherever it falls
  // — never auto-scrolled past. Keyboard Arrow-key navigation after that
  // still scrolls normally to follow the user's focus (see
  // `focusOption` below), since only this initial on-open focus needed
  // `preventScroll`.
  const hasFocusedForThisOpenRef = useRef(false);

  useEffect(() => {
    if (!open) {
      hasFocusedForThisOpenRef.current = false;
      return;
    }
    if (hasFocusedForThisOpenRef.current) return;
    hasFocusedForThisOpenRef.current = true;
    const selectedIndex = projects.findIndex((p) => p.id === selected?.id);
    optionRefs.current[selectedIndex >= 0 ? selectedIndex : 0]?.focus({ preventScroll: true });
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [open, projects, selected]);

  function closeAndRefocusTrigger() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function focusOption(index: number) {
    const count = projects.length;
    if (count === 0) return;
    const wrapped = ((index % count) + count) % count;
    optionRefs.current[wrapped]?.focus();
  }

  function handleTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setOpen(true);
    }
  }

  function handleListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const currentIndex = optionRefs.current.findIndex((el) => el === document.activeElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusOption(currentIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusOption(currentIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        focusOption(0);
        break;
      case "End":
        e.preventDefault();
        focusOption(projects.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        closeAndRefocusTrigger();
        break;
      case "Tab":
        // Don't trap Tab inside the list — let it close and continue past,
        // same as a click outside.
        setOpen(false);
        break;
    }
  }

  if (projects.length === 0) return null;

  return (
    <div className="relative flex items-center gap-2" ref={containerRef}>
      <span className="hidden text-xs font-medium uppercase tracking-wide text-ink-muted sm:inline">
        Project
      </span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Switches which project's data you're viewing (used by Documents and other project-specific screens)"
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
      >
        <Building2 className="h-4 w-4 text-brand-red" aria-hidden />
        <span className="max-w-[10rem] truncate">{selected?.name ?? "Select project"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          onKeyDown={handleListKeyDown}
          // ACTUAL ROOT CAUSE, found by opening this dropdown in a real
          // browser against the running app and measuring its on-screen
          // position directly (getBoundingClientRect / window.scrollY) —
          // every earlier "fix" below (max-h, overflow-y-auto,
          // overscroll-contain, the memoized context value, preventScroll
          // on focus) was chasing a scrolling problem this never actually
          // had. `window.scrollY` stayed 0 the whole time: the *page*
          // never scrolled, and this list's own internal scrollTop was 0
          // too — nothing was being clipped or auto-scrolled. The real
          // defect was POSITIONING: this `<ul>` was `absolute` with no
          // `top-*` class, so the browser fell back to computing its
          // position from where it would've sat in normal flow — and
          // because its parent (`containerRef`, just above) is a
          // `flex items-center` row, that fallback centers a tall
          // absolutely-positioned box around the row's vertical center
          // instead of placing it below it. Measured live: with this list
          // ~320px tall, its top edge landed at -124px relative to the
          // viewport — almost entirely above the visible window, cutting
          // off exactly the first few projects — on the very first open,
          // every time, regardless of scroll position. `top-full` pins it
          // to the bottom of its (short, button-height) container instead
          // of relying on that broken auto-position fallback; `mt-2` then
          // adds the small intentional gap below the trigger. The other
          // classes (max-h-80/overflow-y-auto for 6+ projects,
          // overflow-x-hidden for the rounded corners, overscroll-contain
          // so an exhausted internal scroll never chains to the page) are
          // all still correct and kept, they just weren't the fix for
          // what was actually being reported.
          className="absolute left-0 top-full z-50 mt-2 max-h-80 w-64 overflow-y-auto overflow-x-hidden overscroll-contain rounded-md border border-border bg-surface py-1 shadow-card"
        >
          {projects.map((project, index) => (
            <li key={project.id}>
              <button
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={project.id === selected?.id}
                onClick={() => {
                  setSelectedId(project.id);
                  closeAndRefocusTrigger();
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface-muted",
                  project.id === selected?.id && "font-medium text-brand-red",
                )}
              >
                <span>
                  {project.name}
                  <span className="block text-xs text-ink-muted">{project.location}</span>
                </span>
                {project.id === selected?.id && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  useClickOutside(containerRef, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const selectedIndex = projects.findIndex((p) => p.id === selected?.id);
    optionRefs.current[selectedIndex >= 0 ? selectedIndex : 0]?.focus();
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
    <div className="relative" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
      >
        <Building2 className="h-4 w-4 text-brand-red" aria-hidden />
        <span className="max-w-[10rem] truncate">{selected?.name ?? "Select project"}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          onKeyDown={handleListKeyDown}
          className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-card"
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

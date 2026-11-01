"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils/cn";

/**
 * Single-icon light/dark toggle — deliberately not a two-segment pill like
 * `LanguageSwitcher`. It sits in the same tight header row the nav-overflow
 * fix (docs/OPEN_QUESTIONS.md #77) just finished making fit on one line, so
 * a second multi-button control there risked reintroducing that exact
 * overflow. One compact icon button (~2.5rem) is the safer footprint, and
 * it's also what the admin/portal `Topbar` needs — same component, used in
 * both places.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-ink-muted transition-colors hover:text-ink",
        className,
      )}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}

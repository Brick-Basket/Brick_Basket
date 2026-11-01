"use client";

import * as React from "react";

const STORAGE_KEY = "bb_theme";
type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

/**
 * App-wide light/dark theme provider — requested after the Hindi pass,
 * applied everywhere (public site + admin dashboard + customer portal),
 * unlike `LanguageProvider` which is deliberately public-site-only. Mounted
 * once in the root `src/app/layout.tsx`, wrapping everything.
 *
 * Same mount-then-hydrate-from-`localStorage` pattern as `LanguageProvider`
 * (`bb_lang`) / `AuthProvider`: this component itself defaults its React
 * state to `"light"` and only reconciles with `localStorage` after mount,
 * since `localStorage` isn't available during SSR. On its own, that would
 * mean a saved dark-mode visitor sees a flash of light before this effect
 * runs — worse here than it is for language, since it's the whole page
 * flashing white, not just some text swapping language. To avoid that, a
 * small inline script in `layout.tsx`'s `<head>` (outside React, runs
 * before first paint) reads `localStorage` and sets the `dark` class on
 * `<html>` immediately. This provider's effect below then just reconciles
 * its own React state to match whatever that script already set — it does
 * not do the first paint's theming itself, only keeps state/DOM in sync for
 * every toggle after that.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");

  React.useEffect(() => {
    // Reconcile React state with whatever the pre-hydration inline script
    // (see layout.tsx) already applied to <html> — not a second place that
    // decides the theme, just keeping this provider's state truthful.
    const isDark = document.documentElement.classList.contains("dark");
    setThemeState(isDark ? "dark" : "light");
  }, []);

  const applyTheme = React.useCallback((next: Theme) => {
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort persistence only — the in-memory/DOM state change above still applies for this visit.
    }
  }, []);

  const setTheme = React.useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyTheme(next);
    },
    [applyTheme],
  );

  const toggleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/**
 * The exact source for the pre-hydration inline script `layout.tsx` inlines
 * into `<head>` via `dangerouslySetInnerHTML` — kept here, as a plain
 * string, specifically so it's never passed through Next's JS bundler
 * (which would defer it past first paint and defeat the entire point: it
 * has to run and set the class on `<html>` before the browser paints
 * anything, synchronously, as the HTML streams in). Reads the same
 * `STORAGE_KEY` this provider uses. Defaults to light (no stored
 * preference, or `localStorage` unavailable) — this app does not auto-match
 * OS/browser dark-mode preference, by the owner's own choice.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=window.localStorage.getItem("${STORAGE_KEY}");if(t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

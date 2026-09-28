"use client";

import * as React from "react";
import { t as translate, type Lang } from "@/lib/i18n/translations";

const STORAGE_KEY = "bb_lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Static UI-chrome lookup, e.g. `t("nav.home")`. See translations.ts for the full key set. */
  t: (path: string) => string;
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

/**
 * Public-site language provider (EN / HI) — owner correction: "an
 * additional hindi language should also be part of it for the regional
 * visitors/customers to easily understand." Mounted once, in the `(public)`
 * route group's layout, so it's shared by the Home one-pager and every
 * standalone marketing route (About/Services/Plans/Contact/...), but never
 * loaded into the internal admin/customer-portal shell — staff-facing
 * tooling stays English-only, same convention this codebase already applies
 * everywhere internal.
 *
 * Same mount-then-hydrate-from-storage pattern as `AuthProvider`
 * (`src/components/providers/auth-provider.tsx`): defaults to `"en"` during
 * SSR/first paint (can't read `localStorage` there), then swaps to a saved
 * preference on mount. This means a returning Hindi-preferring visitor sees
 * one brief flash of English before their preference applies — an
 * accepted, deliberate trade-off rather than adding a cookie-based
 * server-side language resolution this pass didn't need to solve.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "hi" || stored === "en") setLangState(stored);
    } catch {
      // localStorage unavailable (private browsing, disabled storage, etc.) — stay on the "en" default.
    }
  }, []);

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best-effort persistence only — the in-memory state change above still applies for this visit.
    }
  }, []);

  const t = React.useCallback((path: string) => translate(lang, path), [lang]);

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils/cn";

/**
 * EN / हिं toggle for the public site's header (desktop + mobile menu) —
 * see `LanguageProvider` for the persistence/fallback behavior.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-semibold",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          lang === "en" ? "bg-brand-red text-white" : "text-ink-muted hover:text-ink",
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
        className={cn(
          "rounded-full px-2.5 py-1 transition-colors",
          lang === "hi" ? "bg-brand-red text-white" : "text-ink-muted hover:text-ink",
        )}
      >
        हिं
      </button>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { useSession } from "@/components/providers/auth-provider";
import { runGlobalSearch, type GlobalSearchResult } from "@/components/shell/global-search-config";
import { cn } from "@/lib/utils/cn";

const DEBOUNCE_MS = 300;

/**
 * `Cmd/Ctrl+K` command-palette search across modules — Part 19. Hand-rolled
 * rather than built on `Dialog`/`Sheet` (`src/components/ui/dialog.tsx`,
 * `sheet.tsx`): both are fixed-width, click-to-close overlays with no
 * arrow-key result navigation, and this needs a wider centered panel plus
 * real keyboard list navigation — a different interaction model, not a
 * reason to duplicate their close/body-scroll-lock logic wholesale. See
 * `global-search-config.ts` for the entity list this searches and
 * `docs/OPEN_QUESTIONS.md` #40.
 */
export function GlobalSearch() {
  const { session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActiveIndex(0);
  };

  // Global Cmd/Ctrl+K to open, from anywhere in the shell.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus the input, and lock body scroll, whenever the palette opens —
  // same body-scroll-lock convention Dialog/Sheet already use.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Debounced search — 300ms, per the master prompt's performance
  // guidance against firing a request on every keystroke.
  useEffect(() => {
    if (!open || !session) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      runGlobalSearch(trimmed, session.user)
        .then((found) => {
          setResults(found);
          setActiveIndex(0);
        })
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query, open, session]);

  const select = (result: GlobalSearchResult) => {
    close();
    router.push(result.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const result = results[activeIndex];
      if (result) select(result);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-ink-muted hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
        aria-label="Search"
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Search…</span>
        <kbd className="hidden rounded border border-border bg-surface-muted px-1.5 py-0.5 text-xs sm:inline">⌘K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24" onClick={close}>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="w-full max-w-lg overflow-hidden rounded-md border border-border bg-surface shadow-card"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search contracts, vendors, POs, GRNs…"
                aria-label="Search across BrickBasket"
                aria-activedescendant={results[activeIndex] ? `global-search-result-${results[activeIndex].id}` : undefined}
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="global-search-results"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-muted" aria-hidden />}
            </div>

            <ul id="global-search-results" role="listbox" className="max-h-80 overflow-y-auto">
              {!loading && query.trim().length >= 2 && results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-ink-muted">No results for &quot;{query.trim()}&quot;.</li>
              )}
              {query.trim().length < 2 && (
                <li className="px-4 py-6 text-center text-sm text-ink-muted">Type at least 2 characters to search.</li>
              )}
              {results.map((result, index) => (
                <li key={`${result.entityLabel}:${result.id}`} id={`global-search-result-${result.id}`} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    onClick={() => select(result)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm",
                      index === activeIndex ? "bg-surface-muted" : "hover:bg-surface-muted",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-red/10 px-2 py-0.5 text-xs font-medium text-brand-red">{result.entityLabel}</span>
                      <span className="font-medium text-ink">{result.title}</span>
                    </span>
                    {result.subtitle && <span className="text-xs text-ink-muted">{result.subtitle}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

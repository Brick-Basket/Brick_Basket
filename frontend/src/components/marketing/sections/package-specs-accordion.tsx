"use client";

import { useState } from "react";
import { ChevronDown, Check, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CONSTRUCTION_PACKAGES, PACKAGE_SPEC_CATEGORIES } from "@/lib/content/public-site";
import { useLanguage } from "@/components/providers/language-provider";
import { PACKAGE_SPEC_CATEGORY_LABEL_HI } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils/cn";

/**
 * JSW-One-Homes-style "Packages" accordion — built directly against a
 * reference screenshot the owner supplied of JSW's own Packages page (an
 * expand/collapse list of categories: Design, Structure, Flooring and dado,
 * Door and windows, Plumbing accessories, Painting, Electrical, Plumbing,
 * Railing and handrails — each opening into a concrete spec list per tier),
 * with an explicit instruction to build BrickBasket's own version "in this
 * format and better than JSW One Homes."
 *
 * Content itself lives in `PACKAGE_SPEC_CATEGORIES`
 * (`src/lib/content/public-site.ts`) — see that constant's own header
 * comment for exactly what's real, owner-confirmed content (the `design`
 * category) versus this frontend's own, clearly-flagged illustrative
 * construction-grade escalation (the other 8 categories), pending
 * BrickBasket's real specification sheet.
 *
 * Three deliberate improvements over the JSW reference: four tiers shown
 * side by side instead of three; every tier column here is already tied to
 * a real, published ₹/sqft rate (`CONSTRUCTION_PACKAGES`) rather than shown
 * with no pricing context; and the closing disclaimer points at a real,
 * already-shipped feature (a Contract's own attached specification file —
 * "Contract Format", added in the Sales & Contract corrections pass) rather
 * than a generic footnote.
 *
 * BILINGUAL (docs/OPEN_QUESTIONS.md #77): heading/description/disclaimer via
 * `t()`, category labels via `PACKAGE_SPEC_CATEGORY_LABEL_HI`. The per-tier
 * bullet content itself (`category.tiers`) is deliberately left English-only
 * — see the i18n file header for the reasoning (dense, real construction
 * terminology that shouldn't be machine-translated without owner review).
 */
export function PackageSpecsAccordion({ selectedSlug }: { selectedSlug?: string }) {
  const { lang, t } = useLanguage();

  // Design open by default — mirrors the reference screenshot's own initial
  // state and gives a visitor something to see without an extra click.
  const [openKeys, setOpenKeys] = useState<Set<string>>(() => new Set(["design"]));

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-ink">{t("packageSpecsAccordion.heading")}</h3>
      <p className="mt-1 text-sm text-ink-muted">{t("packageSpecsAccordion.description")}</p>

      <div className="mt-4 flex flex-col gap-2">
        {PACKAGE_SPEC_CATEGORIES.map((category) => {
          const open = openKeys.has(category.key);
          const label = lang === "hi" ? (PACKAGE_SPEC_CATEGORY_LABEL_HI[category.label] ?? category.label) : category.label;
          return (
            <div key={category.key} className="overflow-hidden rounded-card border border-border">
              <button
                type="button"
                onClick={() => toggle(category.key)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-muted"
              >
                <span className="font-heading text-sm font-semibold text-ink">{label}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
                  aria-hidden
                />
              </button>

              {open && (
                <div className="grid gap-4 border-t border-border bg-surface-muted/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
                  {CONSTRUCTION_PACKAGES.map((pkg) => {
                    const items = category.tiers[pkg.slug] ?? [];
                    const selected = pkg.slug === selectedSlug;
                    return (
                      <div
                        key={pkg.slug}
                        className={cn(
                          "rounded-card border bg-surface p-3",
                          selected ? "border-brand-red ring-1 ring-brand-red" : "border-border",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wide text-brand-red">{pkg.name}</span>
                          {selected && <Badge variant="brand">{t("packageComparisonTable.selectedBadge")}</Badge>}
                        </div>
                        <span className="mt-0.5 block text-xs text-ink-muted">
                          ₹{pkg.rateMin.toLocaleString("en-IN")}
                          {pkg.rateMax !== pkg.rateMin && `–₹${pkg.rateMax.toLocaleString("en-IN")}`}/sqft
                        </span>
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {items.map((item) => (
                            <li key={item} className="flex items-start gap-1.5 text-xs text-ink-muted">
                              <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" aria-hidden />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-ink-muted">
        <FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t("packageSpecsAccordion.disclaimer")}
      </p>
    </div>
  );
}

"use client";

import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { Badge } from "@/components/ui/badge";
import { CONSTRUCTION_PACKAGES, PACKAGE_COMPARISON_ROWS, type ConstructionPackage } from "@/lib/content/public-site";
import { useLanguage } from "@/components/providers/language-provider";
import { PACKAGE_HI, PACKAGE_COMPARISON_ROWS_HI } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils/cn";

/**
 * Shared "what's actually different between our 4 packages" table — used on
 * both the Cost Estimator (`CostEstimatorSection`, right under the package
 * picker) and `/plans` (right under its package cards), so the two pages
 * can never show a different comparison. Built from `PACKAGE_COMPARISON_ROWS`
 * (`src/lib/content/public-site.ts`), which restructures the owner's own
 * cumulative "Everything in X, plus Y" package copy into a real side-by-
 * side grid — see that file's doc comment for exactly what's owner-supplied
 * versus this frontend's own reorganization, and the one flagged assumption
 * about Signature's copy (docs/OPEN_QUESTIONS.md #64).
 *
 * One row per package (not one row per feature) so the mobile fallback
 * `DataTable` already provides reads as a clean per-package spec sheet —
 * "Smart: Design & Planning — X, Site Supervision — Y, ..." — rather than
 * a table too wide to use on a phone.
 *
 * BILINGUAL (docs/OPEN_QUESTIONS.md #77): headings/columns via `t()`;
 * dimension row values via `PACKAGE_COMPARISON_ROWS_HI` (keyed by the
 * English `dimension`, same row-identity-safety pattern used in
 * `comparison-section.tsx`); "Best For" via `PACKAGE_HI`. Package tier
 * names (Essential/Smart/Premium/Signature) stay in English — see the
 * i18n file header for why.
 */
export function PackageComparisonTable({ selectedSlug }: { selectedSlug?: string }) {
  const { lang, t } = useLanguage();

  const columns: DataTableColumn<ConstructionPackage>[] = [
    {
      key: "name",
      header: t("packageComparisonTable.colPackage"),
      render: (pkg) => (
        <span className="flex items-center gap-2 whitespace-nowrap font-medium text-ink">
          {pkg.name}
          {pkg.slug === selectedSlug && <Badge variant="brand">{t("packageComparisonTable.selectedBadge")}</Badge>}
        </span>
      ),
    },
    {
      key: "rate",
      header: t("packageComparisonTable.colRate"),
      render: (pkg) => (
        <span className="whitespace-nowrap">
          ₹{pkg.rateMin.toLocaleString("en-IN")}
          {pkg.rateMax !== pkg.rateMin && `–₹${pkg.rateMax.toLocaleString("en-IN")}`}
          <span className="text-xs text-ink-muted"> /sqft</span>
        </span>
      ),
    },
    ...PACKAGE_COMPARISON_ROWS.map((row): DataTableColumn<ConstructionPackage> => {
      const tr = lang === "hi" ? PACKAGE_COMPARISON_ROWS_HI[row.dimension] : undefined;
      return {
        key: row.dimension,
        header: tr?.dimension ?? row.dimension,
        render: (pkg) => {
          const value = tr?.values[pkg.slug] ?? row.values[pkg.slug] ?? "—";
          return <span className={cn(value === "—" && "text-ink-muted")}>{value}</span>;
        },
      };
    }),
    {
      key: "bestFor",
      header: t("packageComparisonTable.colBestFor"),
      render: (pkg) => (lang === "hi" ? (PACKAGE_HI[pkg.slug]?.bestFor ?? pkg.bestFor) : pkg.bestFor),
      hideOnMobile: true,
    },
  ];

  return (
    <div>
      <h3 className="font-heading text-lg font-semibold text-ink">{t("packageComparisonTable.heading")}</h3>
      <p className="mt-1 text-sm text-ink-muted">{t("packageComparisonTable.description")}</p>
      <div className="mt-4">
        <DataTable columns={columns} rows={CONSTRUCTION_PACKAGES} keyFor={(pkg) => pkg.slug} />
      </div>
    </div>
  );
}

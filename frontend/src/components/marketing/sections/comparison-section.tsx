"use client";

import { X, Check } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { SectionHeading } from "@/components/marketing/section-heading";
import { OLD_WAY_VS_OUR_WAY_ROWS, type OldWayVsOurWayRow } from "@/lib/content/public-site";
import { useLanguage } from "@/components/providers/language-provider";
import { COMPARISON_ROWS_HI } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils/cn";

/**
 * "The Traditional Way vs. The BrickBasket Way" — see
 * `OLD_WAY_VS_OUR_WAY_ROWS` (`src/lib/content/public-site.ts`) for exactly
 * which already-shipped feature backs each row, and why the "traditional"
 * column is written in general industry terms rather than about any named
 * competitor. Shares the `WhyUsSection`/`PackageComparisonTable` pattern:
 * an optional `heading` prop for the Home one-pager, omitted on the
 * standalone `/why-us` page (which uses `PageBanner` instead).
 */
export function ComparisonSection({
  id,
  className,
  showHeading,
}: {
  id?: string;
  className?: string;
  showHeading?: boolean;
}) {
  const { lang, t } = useLanguage();

  // `rowKey` stays the original English dimension (a stable React/DataTable
  // key across a language switch); `dimension` is what's actually displayed
  // and is swapped to its Hindi translation when available.
  const rows: (OldWayVsOurWayRow & { rowKey: string })[] = OLD_WAY_VS_OUR_WAY_ROWS.map((row) => {
    const tr = COMPARISON_ROWS_HI[row.dimension];
    if (lang !== "hi" || !tr) return { ...row, rowKey: row.dimension };
    return { rowKey: row.dimension, dimension: tr.dimension, traditional: tr.traditional, brickBasket: tr.brickBasket };
  });

  const columns: DataTableColumn<OldWayVsOurWayRow & { rowKey: string }>[] = [
    {
      key: "dimension",
      header: t("comparison.colTopic"),
      render: (row) => <span className="font-medium text-ink">{row.dimension}</span>,
    },
    {
      key: "traditional",
      header: t("comparison.colTraditional"),
      render: (row) => (
        <span className="flex items-start gap-2 text-ink-muted">
          <X className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted/60" aria-hidden />
          {row.traditional}
        </span>
      ),
    },
    {
      key: "brickBasket",
      header: t("comparison.colBrickBasket"),
      render: (row) => (
        <span className="flex items-start gap-2 text-ink">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          {row.brickBasket}
        </span>
      ),
    },
  ];

  return (
    <section id={id} className={cn("container py-16 md:py-20", className)}>
      {showHeading && (
        <SectionHeading eyebrow={t("comparison.headingEyebrow")} title={t("comparison.headingTitle")} className="mb-10" />
      )}
      <DataTable columns={columns} rows={rows} keyFor={(row) => row.rowKey} />
    </section>
  );
}

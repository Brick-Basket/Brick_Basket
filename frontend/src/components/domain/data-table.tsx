"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface DataTableColumn<Row> {
  key: string;
  header: string;
  /** Omit to make the column unsortable. Passed to `onSortChange`. */
  sortKey?: string;
  render: (row: Row) => React.ReactNode;
  className?: string;
  /** Shown in the mobile card fallback alongside the value; omit for a column that's table-only (e.g. row actions, which render separately). */
  hideOnMobile?: boolean;
  /**
   * Right-aligns the header label and every cell, and applies `tabular-nums`
   * so digits stay column-width-stable as they change (the standard
   * spreadsheet convention for anything numeric — counts, rates, amounts).
   * Left-aligned (the default) suits text columns; set this on any column
   * whose values are numbers or currency. Desktop table only — the mobile
   * card fallback keeps every value right-aligned already, by its own
   * `<dt>`/`<dd>` layout, so this has no effect there.
   */
  align?: "left" | "right";
}

/**
 * Generic sortable table with a mobile card-list fallback below `md`, used
 * by every list screen from Part 4 onward (Leads today; Vendors, RFQs,
 * POs, GRN etc. later) so dense operational tables don't overflow on
 * phones. Sorting/filtering/pagination stay the caller's responsibility —
 * this component only renders what it's given and reports sort-header
 * clicks back up.
 */
export function DataTable<Row>({
  columns,
  rows,
  keyFor,
  sortBy,
  sortDir = "asc",
  onSortChange,
  onRowClick,
  rowActions,
}: {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  keyFor: (row: Row) => string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  onRowClick?: (row: Row) => void;
  /** Rendered as an extra trailing column (desktop) / footer row (mobile card). */
  rowActions?: (row: Row) => React.ReactNode;
}) {
  return (
    <>
      {/* Desktop / tablet: real table */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-card border border-border md:block">
        <table className="w-full text-left text-sm">
          {/* Frozen header row (the Excel "freeze panes" convention) — sticks
              to the top of this table's own scroll container (capped at
              70vh above) once a long result set scrolls past the fold,
              rather than to the page/window, so it never fights the
              Topbar/Breadcrumbs above it for space. */}
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-muted">
            <tr>
              {columns.map((col) => {
                // FRONTEND IMPLEMENTATION DECISION (post-Part-20
                // stabilization pass, Phase 14): a sortable column's
                // current direction was only conveyed visually (the arrow
                // icon) — `aria-sort` is what lets a screen-reader user
                // know a header is sorted at all, and which way. Only the
                // currently-sorted column gets "ascending"/"descending";
                // every other sortable column is "none" (not "other",
                // which the ARIA spec reserves for a table sorted by a
                // column the table itself can't identify — not the case
                // here). See docs/OPEN_QUESTIONS.md #48.
                const isSorted = col.sortKey && sortBy === col.sortKey;
                const ariaSort = col.sortKey
                  ? isSorted
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                  : undefined;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 font-medium text-ink-muted",
                      col.align === "right" && "text-right",
                      col.className,
                    )}
                  >
                    {col.sortKey ? (
                      <button
                        type="button"
                        onClick={() => onSortChange?.(col.sortKey!)}
                        className={cn(
                          "inline-flex items-center gap-1 hover:text-ink",
                          col.align === "right" && "flex-row-reverse",
                        )}
                      >
                        {col.header}
                        <SortIcon active={!!isSorted} dir={sortDir} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th scope="col" className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={keyFor(row)}
                className={cn(
                  // Zebra striping (the standard spreadsheet scanning aid) —
                  // on top of, not instead of, the existing hover highlight;
                  // Tailwind emits `hover:` rules after the plain utility of
                  // the same property, so hover still wins over the stripe.
                  "border-b border-border last:border-0 even:bg-surface-muted/40",
                  onRowClick && "cursor-pointer hover:bg-surface-muted",
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 align-middle text-ink",
                      col.align === "right" && "text-right tabular-nums",
                      col.className,
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <div
            key={keyFor(row)}
            className={cn(
              "rounded-card border border-border bg-surface p-4",
              onRowClick && "cursor-pointer active:bg-surface-muted",
            )}
            onClick={() => onRowClick?.(row)}
          >
            <dl className="flex flex-col gap-2">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex items-baseline justify-between gap-3 text-sm">
                    <dt className="shrink-0 text-ink-muted">{col.header}</dt>
                    <dd className="text-right text-ink">{col.render(row)}</dd>
                  </div>
                ))}
            </dl>
            {rowActions && (
              <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                {rowActions(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />;
  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" aria-hidden />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" aria-hidden />
  );
}

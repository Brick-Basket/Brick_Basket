"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import { CONTRACT_CATEGORY_CONFIG, CONTRACT_CATEGORY_ORDER } from "@/components/contracts/contract-category-config";
import { ACE_UOM_CONFIG } from "@/components/ace/ace-uom-config";
import { formatINR } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";
import type { ACEItem } from "@/types/domain/ace-item";
import type { ContractCategory } from "@/types/domain/contract";

export function ACETable({
  items,
  startIndex = 0,
  sortBy,
  sortDir,
  onSortChange,
  onView,
  groupByCategory = true,
}: {
  items: ACEItem[];
  /**
   * Document 2 correction: a leading serial-number column. `startIndex`
   * is the 0-based offset of this page's first row within the full
   * (unpaginated) result set — pass `(page - 1) * pageSize` so numbering
   * continues across pages instead of restarting at 1 on every page.
   */
  startIndex?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  /** Omit (pass `undefined`) for a read-only viewer — rows become non-interactive. */
  onView?: (item: ACEItem) => void;
  /**
   * Section the rows by cost category — civil/electrical/plumbing/etc. —
   * the way every comparable cost-estimate/BOQ screen (Procore Estimating,
   * Buildertrend, Zoho's BOQ widget) groups line items by cost code rather
   * than listing them flat, and the way Excel's own "Group/Outline" feature
   * presents subtotaled sections. On by default — the flat, ungrouped
   * table (every category interleaved, sorted only by item/rate — this
   * component's only behavior before this pass) is kept as an explicit
   * opt-out via this prop, in case a future caller wants it (`ACETable` is
   * only used by `/admin/supply-chain/ace` today).
   */
  groupByCategory?: boolean;
}) {
  const { projects: allProjects } = useProjects();
  const indexById = new Map(items.map((item, idx) => [item.id, idx]));
  const projectName = (id: string) => allProjects.find((p) => p.id === id)?.name ?? "—";

  const flatColumns: DataTableColumn<ACEItem>[] = [
    {
      key: "srNo",
      header: "Sr. No.",
      hideOnMobile: true,
      align: "right",
      render: (i) => startIndex + (indexById.get(i.id) ?? 0) + 1,
    },
    {
      key: "itemDescription",
      header: "Item",
      sortKey: "itemDescription",
      render: (i) => (
        <div>
          <p className="font-medium text-ink">{i.itemDescription}</p>
          {i.notes && <p className="text-xs text-ink-muted">{i.notes}</p>}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (i) => <Badge variant="neutral">{CONTRACT_CATEGORY_CONFIG[i.category].label}</Badge>,
    },
    {
      key: "project",
      header: "Project",
      render: (i) => projectName(i.projectId),
    },
    {
      key: "uom",
      header: "UOM",
      hideOnMobile: true,
      render: (i) => ACE_UOM_CONFIG[i.uom].label,
    },
    {
      key: "rate",
      header: "Rate",
      sortKey: "rate",
      align: "right",
      render: (i) => `${formatINR(i.rate)} / ${ACE_UOM_CONFIG[i.uom].label}`,
    },
  ];

  if (!groupByCategory) {
    return (
      <DataTable
        columns={flatColumns}
        rows={items}
        keyFor={(i) => i.id}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSortChange}
        onRowClick={onView}
      />
    );
  }

  return (
    <GroupedACETable
      items={items}
      startIndex={startIndex}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={onSortChange}
      onView={onView}
      projectName={projectName}
    />
  );
}

/**
 * The grouped/"Excel outline" presentation — one `<table>`, one shared
 * sticky header, and one `<tbody>` per category present in `items` (plain
 * HTML allows more than one `tbody` per `table`; this is what makes a
 * collapsible category band possible without nesting a second table per
 * group). Category order follows `CONTRACT_CATEGORY_ORDER` (the same
 * canonical order used everywhere else categories are listed, e.g.
 * `ACEFilters`'s own dropdown) rather than first-seen-in-`items` order, so
 * the groups land in the same place every time regardless of how the
 * current page happens to be sorted.
 *
 * `rate` is deliberately never summed into a per-category or grand total —
 * items in one category can carry different UOMs (₹/kg next to ₹/Cu.ft),
 * so a sum would silently add incompatible units together. Each group
 * header shows an item *count* instead ("5 items"), which is both honest
 * and still the thing a skimming reader actually wants from a subtotal row.
 */
function GroupedACETable({
  items,
  startIndex,
  sortBy,
  sortDir,
  onSortChange,
  onView,
  projectName,
}: {
  items: ACEItem[];
  startIndex: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSortChange: (key: string) => void;
  onView?: (item: ACEItem) => void;
  projectName: (id: string) => string;
}) {
  const [collapsed, setCollapsed] = useState<Set<ContractCategory>>(new Set());

  const groups = useMemo(() => {
    const byCategory = new Map<ContractCategory, ACEItem[]>();
    for (const item of items) {
      const bucket = byCategory.get(item.category);
      if (bucket) bucket.push(item);
      else byCategory.set(item.category, [item]);
    }
    return CONTRACT_CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => ({
      category: cat,
      items: byCategory.get(cat)!,
    }));
  }, [items]);

  // BUG FIX (owner report, screenshot: Sr. No. column reading 3, 4, 1, 2, 5
  // instead of 1-5 in order). `indexById` used to be built straight from
  // `items` — this table's incoming prop order, e.g. alphabetical by
  // itemDescription — and Sr. No. rendered each row's position in *that*
  // order. But rows are never actually displayed in `items` order here:
  // they're bucketed into `groups` by category first. So a row's Sr. No.
  // reflected its alphabetical rank, not its position in the category-
  // grouped list it actually appears in — exactly the gap
  // `docs/MANUAL_QA_CHECKLIST.md` 1.5 called out to check for ("numbering
  // should still run in order within what's visible"). Fixed by building
  // the index from `groups`' own flattened, already-category-ordered
  // sequence instead of the raw `items` prop, so Sr. No. always counts
  // 1, 2, 3... in exactly the order rows render on screen, regardless of
  // which category each one lands in.
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    for (const group of groups) {
      for (const item of group.items) {
        map.set(item.id, i);
        i += 1;
      }
    }
    return map;
  }, [groups]);

  const toggleGroup = (category: ContractCategory) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const sortHeader = (key: "itemDescription" | "rate", label: string, align?: "right") => {
    const isSorted = sortBy === key;
    const ariaSort = isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none";
    return (
      <th
        scope="col"
        aria-sort={ariaSort}
        className={cn("whitespace-nowrap px-4 py-3 font-medium text-ink-muted", align === "right" && "text-right")}
      >
        <button
          type="button"
          onClick={() => onSortChange(key)}
          className={cn("inline-flex items-center gap-1 hover:text-ink", align === "right" && "flex-row-reverse")}
        >
          {label}
          <SortGlyph active={isSorted} dir={sortDir} />
        </button>
      </th>
    );
  };

  return (
    <>
      {/* Desktop / tablet: one table, grouped tbody-per-category, frozen header */}
      <div className="hidden max-h-[70vh] overflow-auto rounded-card border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-border bg-surface-muted">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium text-ink-muted">
                Sr. No.
              </th>
              {sortHeader("itemDescription", "Item")}
              <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">
                Project
              </th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium text-ink-muted">
                UOM
              </th>
              {sortHeader("rate", "Rate", "right")}
            </tr>
          </thead>
          {groups.map(({ category, items: groupItems }) => {
            const isCollapsed = collapsed.has(category);
            return (
              <tbody key={category}>
                <tr className="border-b border-border bg-surface-muted/70">
                  <td colSpan={5} className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => toggleGroup(category)}
                      aria-expanded={!isCollapsed}
                      className="inline-flex w-full items-center gap-2 text-left font-semibold text-ink hover:text-brand-red"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                      )}
                      {CONTRACT_CATEGORY_CONFIG[category].label}
                      <Badge variant="neutral" className="font-normal">
                        {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
                      </Badge>
                    </button>
                  </td>
                </tr>
                {!isCollapsed &&
                  groupItems.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-border last:border-0 even:bg-surface-muted/40",
                        onView && "cursor-pointer hover:bg-surface-muted",
                      )}
                      onClick={() => onView?.(item)}
                    >
                      <td className="px-4 py-3 text-right align-middle tabular-nums text-ink">
                        {startIndex + (indexById.get(item.id) ?? 0) + 1}
                      </td>
                      <td className="px-4 py-3 align-middle text-ink">
                        <p className="font-medium text-ink">{item.itemDescription}</p>
                        {item.notes && <p className="text-xs text-ink-muted">{item.notes}</p>}
                      </td>
                      <td className="px-4 py-3 align-middle text-ink">{projectName(item.projectId)}</td>
                      <td className="px-4 py-3 align-middle text-ink">{ACE_UOM_CONFIG[item.uom].label}</td>
                      <td className="px-4 py-3 text-right align-middle tabular-nums text-ink">
                        {formatINR(item.rate)} / {ACE_UOM_CONFIG[item.uom].label}
                      </td>
                    </tr>
                  ))}
              </tbody>
            );
          })}
        </table>
      </div>

      {/* Mobile: the same grouping, as collapsible card sections */}
      <div className="flex flex-col gap-4 md:hidden">
        {groups.map(({ category, items: groupItems }) => {
          const isCollapsed = collapsed.has(category);
          return (
            <div key={category} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => toggleGroup(category)}
                aria-expanded={!isCollapsed}
                className="flex items-center gap-2 rounded-card border border-border bg-surface-muted/70 px-4 py-2 text-left font-semibold text-ink"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {CONTRACT_CATEGORY_CONFIG[category].label}
                <Badge variant="neutral" className="font-normal">
                  {groupItems.length} {groupItems.length === 1 ? "item" : "items"}
                </Badge>
              </button>
              {!isCollapsed && (
                <div className="flex flex-col gap-3">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-card border border-border bg-surface p-4",
                        onView && "cursor-pointer active:bg-surface-muted",
                      )}
                      onClick={() => onView?.(item)}
                    >
                      <dl className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <dt className="shrink-0 text-ink-muted">Item</dt>
                          <dd className="text-right text-ink">
                            {item.itemDescription}
                            {item.notes && <span className="block text-xs text-ink-muted">{item.notes}</span>}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <dt className="shrink-0 text-ink-muted">Project</dt>
                          <dd className="text-right text-ink">{projectName(item.projectId)}</dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <dt className="shrink-0 text-ink-muted">Rate</dt>
                          <dd className="text-right tabular-nums text-ink">
                            {formatINR(item.rate)} / {ACE_UOM_CONFIG[item.uom].label}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function SortGlyph({ active, dir }: { active: boolean; dir?: "asc" | "desc" }) {
  if (!active) return <ChevronDown className="h-3.5 w-3.5 opacity-40" aria-hidden />;
  return (
    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", dir === "desc" && "rotate-180")} aria-hidden />
  );
}

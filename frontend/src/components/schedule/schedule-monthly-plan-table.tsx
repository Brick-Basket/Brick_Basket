"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/domain/data-table";
import {
  formatMonthKey,
  getMonthKeysInRange,
  getMonthlyPlanTotal,
  getPlannedQuantityForMonth,
} from "@/components/schedule/schedule-monthly-plan-math";
import type { ScheduleActivity } from "@/types/domain/project-schedule";

/**
 * Collapsible monthly planned-quantity breakdown, added in the post-Part-20
 * stabilization pass (Phase 3) — a dedicated table rather than extra
 * columns bolted onto `ScheduleTable`, so that table's existing column set
 * and mobile card layout (Part 13) are left completely untouched; this
 * section is purely additive below it. Collapsed by default: most
 * activities in this demo dataset have no monthly plan at all
 * (`monthlyPlan: []` is the default/valid "not broken down" state — see
 * `src/types/domain/project-schedule.ts`), so an expanded-by-default table
 * would mostly show empty dashes. Reuses `DataTable` — same as every other
 * dense table in this app — so it inherits the same mobile card fallback
 * without any bespoke responsive markup.
 */
export function ScheduleMonthlyPlanTable({ activities }: { activities: ScheduleActivity[] }) {
  const [expanded, setExpanded] = useState(false);
  const withPlan = activities.filter((a) => a.monthlyPlan.length > 0);

  if (withPlan.length === 0) return null;

  // Union of months across every activity that has a monthly plan — the
  // same "dynamic range, computed from whichever activities are loaded,
  // never hardcoded" approach `ScheduleGanttChart`'s own month header uses
  // (Part 13), just scoped to the activities that actually have a plan.
  const allMonths = Array.from(new Set(withPlan.flatMap((a) => getMonthKeysInRange(a.plannedStart, a.plannedEnd)))).sort();

  const columns: DataTableColumn<ScheduleActivity>[] = [
    {
      key: "activity",
      header: "Activity",
      render: (a) => <p className="font-medium text-ink">{a.activity}</p>,
    },
    ...allMonths.map(
      (month): DataTableColumn<ScheduleActivity> => ({
        key: month,
        header: formatMonthKey(month),
        render: (a) => {
          const qty = getPlannedQuantityForMonth(a.monthlyPlan, month);
          return qty === null ? <span className="text-ink-muted">—</span> : <span>{qty.toLocaleString("en-IN")}</span>;
        },
      }),
    ),
    {
      key: "total",
      header: "Total Planned",
      render: (a) => (
        <span className="font-medium text-ink">
          {getMonthlyPlanTotal(a.monthlyPlan).toLocaleString("en-IN")} {a.uom}
        </span>
      ),
    },
  ];

  return (
    <div className="rounded-card border border-border">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-ink"
        aria-expanded={expanded}
      >
        <span>
          Monthly Planned Quantities <span className="text-ink-muted">({withPlan.length} of {activities.length} activities broken down)</span>
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />}
      </button>
      {expanded && (
        <div className="border-t border-border p-3">
          <DataTable columns={columns} rows={withPlan} keyFor={(a) => a.id} />
        </div>
      )}
    </div>
  );
}

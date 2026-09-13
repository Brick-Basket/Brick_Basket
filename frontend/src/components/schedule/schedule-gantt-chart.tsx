import { getDelayDays, getExecutedQuantity, getPercentComplete, getProgressState } from "@/components/schedule/schedule-progress-math";
import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseISODate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

/**
 * The "Gantt" half of the Gantt/schedule-table hybrid. The displayed date
 * range is always computed from whichever activities are passed in —
 * `min(plannedStart)` to `max(plannedEnd)` — never a hardcoded window (the
 * owner requirements explicitly call out "dynamic date/month range," and
 * the sample Oct-26–Mar-27 dates elsewhere in this app are illustrative
 * only, see `docs/OPEN_QUESTIONS.md` #5). Each bar's filled portion is the
 * same pro-rata progress percentage the schedule table shows, colored by
 * the same computed status (green on track/complete, amber behind, red
 * overdue).
 */
export function ScheduleGanttChart({
  activities,
  progressByActivity,
}: {
  activities: ScheduleActivity[];
  progressByActivity: Map<string, ScheduleProgressEntry[]>;
}) {
  if (activities.length === 0) return null;

  const starts = activities.map((a) => parseISODate(a.plannedStart).getTime());
  const ends = activities.map((a) => parseISODate(a.plannedEnd).getTime());
  const rangeStartMs = Math.min(...starts);
  const rangeEndMsRaw = Math.max(...ends);
  // Guard against a zero-width range (every activity on the same single day).
  const rangeEndMs = rangeEndMsRaw > rangeStartMs ? rangeEndMsRaw : rangeStartMs + MS_PER_DAY;
  const totalMs = rangeEndMs - rangeStartMs;

  const percentOf = (ms: number) => Math.max(0, Math.min(100, ((ms - rangeStartMs) / totalMs) * 100));

  // Month gridlines/labels — computed from the actual range, never hardcoded.
  const months: { label: string; leftPercent: number }[] = [];
  const cursor = new Date(rangeStartMs);
  cursor.setDate(1);
  const rangeEndDate = new Date(rangeEndMs);
  while (cursor.getTime() <= rangeEndDate.getTime()) {
    months.push({ label: monthLabel(cursor), leftPercent: percentOf(cursor.getTime()) });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const now = Date.now();
  const showTodayLine = now >= rangeStartMs && now <= rangeEndMs;
  const todayPercent = percentOf(now);

  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <div className="min-w-[720px]">
        {/* Month header */}
        <div className="relative flex h-8 border-b border-border bg-surface-muted">
          <div className="w-48 shrink-0 border-r border-border" />
          <div className="relative flex-1">
            {months.map((m, i) => (
              <span
                key={`${m.label}-${i}`}
                className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-medium text-ink-muted"
                style={{ left: `${m.leftPercent}%`, marginLeft: i === 0 ? 0 : "0.5rem" }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        {/* Activity rows */}
        <div className="relative">
          {showTodayLine && (
            <div
              className="absolute top-0 bottom-0 z-10 w-px bg-brand-red/60"
              style={{ left: `calc(12rem + (100% - 12rem) * ${(todayPercent / 100).toFixed(4)})` }}
              aria-hidden
            />
          )}
          {activities.map((activity) => {
            const executed = getExecutedQuantity(progressByActivity.get(activity.id) ?? []);
            const percent = getPercentComplete(activity, executed);
            const state = getProgressState(activity, percent);
            const delayDays = getDelayDays(activity, percent);
            const barLeft = percentOf(parseISODate(activity.plannedStart).getTime());
            const barRight = percentOf(parseISODate(activity.plannedEnd).getTime());
            const barWidth = Math.max(barRight - barLeft, 1);

            return (
              <div key={activity.id} className="flex items-center border-b border-border last:border-0">
                <div
                  className="flex w-48 shrink-0 items-center justify-between gap-1 truncate border-r border-border px-3 py-2.5 text-xs text-ink"
                  title={delayDays > 0 ? `${activity.activity} — ${delayDays} day${delayDays === 1 ? "" : "s"} delayed` : activity.activity}
                >
                  <span className="truncate">{activity.activity}</span>
                  {/* Visible delay-in-days reflection, added post-Part-20
                      stabilization pass (Phase 3) — the Gantt bar's red fill
                      already implied "overdue," but never showed the actual
                      day count the owner's requirement asks for. */}
                  {delayDays > 0 && (
                    <span className="shrink-0 rounded-full bg-error/10 px-1.5 py-0.5 text-[10px] font-semibold text-error">
                      +{delayDays}d
                    </span>
                  )}
                </div>
                <div className="relative flex-1 py-2.5">
                  <div
                    className="relative h-4 rounded-sm bg-surface-muted"
                    style={{ marginLeft: `${barLeft}%`, width: `${barWidth}%` }}
                  >
                    <div
                      className={
                        state === "overdue" ? "h-full rounded-sm bg-error" : state === "behind" ? "h-full rounded-sm bg-warning" : "h-full rounded-sm bg-success"
                      }
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

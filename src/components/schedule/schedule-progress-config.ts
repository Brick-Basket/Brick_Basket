import type { BadgeProps } from "@/components/ui/badge";
import type { ScheduleProgressState } from "@/components/schedule/schedule-progress-math";

/** Label + `StatusBadge` tone for each computed `ScheduleProgressState` — see `docs/OPEN_QUESTIONS.md` #34 for how these states are derived. */
export const SCHEDULE_PROGRESS_STATE_CONFIG: Record<ScheduleProgressState, { label: string; tone: BadgeProps["variant"] }> = {
  not_started: { label: "Not Started", tone: "neutral" },
  behind: { label: "Behind Schedule", tone: "warning" },
  on_track: { label: "On Track", tone: "success" },
  overdue: { label: "Overdue", tone: "error" },
  completed: { label: "Completed", tone: "success" },
};

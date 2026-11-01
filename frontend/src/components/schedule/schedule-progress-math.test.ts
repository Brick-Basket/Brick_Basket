import { describe, expect, it } from "vitest";
import { getDelayDays, getExecutedQuantity, getExpectedPercent, getPercentComplete, getProgressState } from "./schedule-progress-math";
import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

function activity(
  plannedStart: string,
  plannedEnd: string,
  quantity: number,
  monthlyPlan: { month: string; plannedQuantity: number }[] = [],
): ScheduleActivity {
  return { plannedStart, plannedEnd, quantity, monthlyPlan } as unknown as ScheduleActivity;
}

function entry(recordedAt: string, executedQuantity: number): ScheduleProgressEntry {
  return { recordedAt, executedQuantity } as unknown as ScheduleProgressEntry;
}

describe("schedule-progress-math", () => {
  describe("getExecutedQuantity", () => {
    it("returns 0 when there's no progress recorded yet", () => {
      expect(getExecutedQuantity([])).toBe(0);
    });

    it("returns the entry with the latest recordedAt, regardless of array order", () => {
      const entries = [entry("2026-08-10", 100), entry("2026-09-01", 250), entry("2026-08-20", 180)];
      expect(getExecutedQuantity(entries)).toBe(250);
    });
  });

  describe("getPercentComplete", () => {
    it("divides executed by planned quantity, as a percentage", () => {
      expect(getPercentComplete(activity("2026-08-01", "2026-08-31", 400), 200)).toBe(50);
    });

    it("clamps to 100 on over-execution", () => {
      expect(getPercentComplete(activity("2026-08-01", "2026-08-31", 400), 999)).toBe(100);
    });

    it("guards against a zero/negative planned quantity, returning 0 rather than Infinity", () => {
      expect(getPercentComplete(activity("2026-08-01", "2026-08-31", 0), 50)).toBe(0);
    });
  });

  describe("getExpectedPercent", () => {
    const act = activity("2026-08-01", "2026-08-11", 100); // 10-day span

    it("is 0 before the planned start", () => {
      expect(getExpectedPercent(act, new Date("2026-07-25T00:00:00"))).toBe(0);
    });

    it("is a straight-line pro-rata value partway through the span", () => {
      // Day 5 of 10 → 50%.
      expect(getExpectedPercent(act, new Date("2026-08-06T00:00:00"))).toBe(50);
    });

    it("is clamped to 100 once past the planned end", () => {
      expect(getExpectedPercent(act, new Date("2026-09-01T00:00:00"))).toBe(100);
    });

    it("treats a same-day (zero-width) plan as instantly 100% once started", () => {
      const sameDay = activity("2026-08-01", "2026-08-01", 1);
      expect(getExpectedPercent(sameDay, new Date("2026-08-01T00:00:00"))).toBe(100);
      expect(getExpectedPercent(sameDay, new Date("2026-07-31T00:00:00"))).toBe(0);
    });

    // docs/OPEN_QUESTIONS.md #50(c): once an activity has a monthly
    // breakdown, "expected" progress follows that month-by-month plan
    // instead of the whole-activity straight line above.
    describe("with a monthly breakdown (docs/OPEN_QUESTIONS.md #50c)", () => {
      // Aug 2026 (31 days) + Sep 2026 (30 days), quantity 100, split 60/40.
      const act = activity("2026-08-01", "2026-09-30", 100, [
        { month: "2026-08", plannedQuantity: 60 },
        { month: "2026-09", plannedQuantity: 40 },
      ]);

      it("is 0 before the planned start", () => {
        expect(getExpectedPercent(act, new Date("2026-07-25T00:00:00"))).toBe(0);
      });

      it("pro-rates within the first month by day-fraction", () => {
        // Aug 16 is day 16 of Aug's 31 days → 16/31 of that month's 60.
        expect(getExpectedPercent(act, new Date("2026-08-16T00:00:00"))).toBeCloseTo((16 / 31) * 60, 5);
      });

      it("gives full credit for a month already finished", () => {
        expect(getExpectedPercent(act, new Date("2026-08-31T00:00:00"))).toBe(60);
      });

      it("adds the new month's day-fraction on top of the prior month's full credit", () => {
        // Sep 1 → Aug's full 60 + 1/30 of Sep's 40.
        expect(getExpectedPercent(act, new Date("2026-09-01T00:00:00"))).toBeCloseTo(60 + (1 / 30) * 40, 5);
        // Sep 15 → 60 + 15/30 of 40 = 80.
        expect(getExpectedPercent(act, new Date("2026-09-15T00:00:00"))).toBe(80);
      });

      it("is 100 once every planned month is behind asOf", () => {
        expect(getExpectedPercent(act, new Date("2026-09-30T00:00:00"))).toBe(100);
        expect(getExpectedPercent(act, new Date("2026-10-05T00:00:00"))).toBe(100);
      });

      it("pro-rates the final month using only the days that fall within plannedEnd, when the activity ends mid-month", () => {
        // Same total split, but the activity actually ends Sep 10, not Sep 30 —
        // Sep's window is only days 1-10, so day 5 is the midpoint (50%), not day 5/30.
        const midMonthEnd = activity("2026-08-01", "2026-09-10", 100, [
          { month: "2026-08", plannedQuantity: 60 },
          { month: "2026-09", plannedQuantity: 40 },
        ]);
        expect(getExpectedPercent(midMonthEnd, new Date("2026-09-05T00:00:00"))).toBeCloseTo(60 + 0.5 * 40, 5);
      });

      it("falls back to the straight-line formula for an activity with no breakdown", () => {
        const noBreakdown = activity("2026-08-01", "2026-08-31", 100);
        // Unaffected by the monthly-plan change above — same formula as the top-level describe block.
        expect(getExpectedPercent(noBreakdown, new Date("2026-08-16T00:00:00"))).toBe(50);
      });
    });
  });

  describe("getDelayDays", () => {
    const act = activity("2026-08-01", "2026-08-31", 100);

    it("is 0 once the activity is 100% complete, however late", () => {
      expect(getDelayDays(act, 100, new Date("2026-12-01T00:00:00"))).toBe(0);
    });

    it("is 0 before the planned end, whatever the pace", () => {
      expect(getDelayDays(act, 10, new Date("2026-08-15T00:00:00"))).toBe(0);
    });

    it("is the number of days past plannedEnd while still incomplete", () => {
      expect(getDelayDays(act, 80, new Date("2026-09-10T00:00:00"))).toBe(10);
    });
  });

  describe("getProgressState", () => {
    const act = activity("2026-08-01", "2026-08-31", 100);

    it("is 'completed' at 100%, regardless of date", () => {
      expect(getProgressState(act, 100, new Date("2026-07-01T00:00:00"))).toBe("completed");
    });

    it("is 'not_started' before plannedStart with nothing executed", () => {
      expect(getProgressState(act, 0, new Date("2026-07-25T00:00:00"))).toBe("not_started");
    });

    it("is 'overdue' once past plannedEnd and still incomplete", () => {
      expect(getProgressState(act, 50, new Date("2026-09-05T00:00:00"))).toBe("overdue");
    });

    it("is 'on_track' when at or ahead of the pro-rata expected pace", () => {
      // Day 15 of 30 → ~50% expected; 60% actual is ahead of pace.
      expect(getProgressState(act, 60, new Date("2026-08-16T00:00:00"))).toBe("on_track");
    });

    it("is 'behind' when short of the pro-rata expected pace but not yet overdue", () => {
      expect(getProgressState(act, 20, new Date("2026-08-16T00:00:00"))).toBe("behind");
    });
  });
});

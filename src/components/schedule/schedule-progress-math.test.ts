import { describe, expect, it } from "vitest";
import { getDelayDays, getExecutedQuantity, getExpectedPercent, getPercentComplete, getProgressState } from "./schedule-progress-math";
import type { ScheduleActivity, ScheduleProgressEntry } from "@/types/domain/project-schedule";

function activity(plannedStart: string, plannedEnd: string, quantity: number): ScheduleActivity {
  return { plannedStart, plannedEnd, quantity } as unknown as ScheduleActivity;
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

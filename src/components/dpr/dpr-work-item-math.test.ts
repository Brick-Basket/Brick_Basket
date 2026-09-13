import { describe, expect, it } from "vitest";
import {
  getCumulativeQty,
  getLatestPlannedQty,
  getLineUom,
  getPercentComplete,
  getPreviousQty,
  getTotalManpower,
} from "./dpr-work-item-math";
import type { DPRWorkItemHistoryEntry } from "@/lib/api/adapters/dpr-adapter";
import type { DPRWorkItemMaster } from "@/types/domain/dpr";

function historyEntry(dprId: string, reportDate: string, workItemMasterId: string, todayQty: number, plannedQty: number, createdAt = "2026-01-01T00:00:00.000Z"): DPRWorkItemHistoryEntry {
  return {
    dpr: { id: dprId, reportDate } as DPRWorkItemHistoryEntry["dpr"],
    line: { workItemMasterId, todayQty, plannedQty, createdAt } as unknown as DPRWorkItemHistoryEntry["line"],
  } as unknown as DPRWorkItemHistoryEntry;
}

describe("dpr-work-item-math", () => {
  describe("getPreviousQty", () => {
    const history = [
      historyEntry("dpr_1", "2026-09-01", "civil_1", 10, 100),
      historyEntry("dpr_2", "2026-09-05", "civil_1", 15, 100),
      historyEntry("dpr_3", "2026-09-10", "civil_1", 5, 100), // the DPR currently open
      historyEntry("dpr_4", "2026-09-03", "electrical_1", 999, 100), // different work item
    ];

    it("sums todayQty from strictly-earlier reports for the same work item, excluding the DPR currently open", () => {
      expect(getPreviousQty(history, "civil_1", "dpr_3", "2026-09-10")).toBe(25); // 10 + 15, not the 5 from dpr_3 itself
    });

    it("excludes lines for a different work item entirely", () => {
      // "plumbing_1" has no entries at all in `history` — this actually
      // exercises the exclusion filter. Querying "electrical_1" here would
      // be wrong: dpr_4 IS an earlier, non-current entry for "electrical_1"
      // itself, so it would correctly count toward that item's own total
      // (999), not toward whatever's being excluded.
      expect(getPreviousQty(history, "plumbing_1", "dpr_3", "2026-09-10")).toBe(0);
    });

    it("returns 0 when there's no earlier history", () => {
      expect(getPreviousQty(history, "civil_1", null, "2026-01-01")).toBe(0);
    });
  });

  describe("getCumulativeQty", () => {
    it("is previous plus today's incremental delta", () => {
      expect(getCumulativeQty(25, 5)).toBe(30);
      expect(getCumulativeQty(0, 10)).toBe(10);
    });
  });

  describe("getPercentComplete", () => {
    it("divides cumulative by planned, as a percentage", () => {
      expect(getPercentComplete(50, 100)).toBe(50);
    });

    it("clamps to 100 on over-execution", () => {
      expect(getPercentComplete(150, 100)).toBe(100);
    });

    it("guards against a zero/negative planned quantity, returning 0 rather than Infinity", () => {
      expect(getPercentComplete(50, 0)).toBe(0);
      expect(getPercentComplete(50, -10)).toBe(0);
    });
  });

  describe("getLatestPlannedQty", () => {
    const history = [
      historyEntry("dpr_1", "2026-09-01", "civil_1", 10, 100),
      historyEntry("dpr_2", "2026-09-05", "civil_1", 15, 120), // most recent by reportDate
      historyEntry("dpr_3", "2026-09-10", "civil_1", 5, 999), // excluded — the DPR currently open
    ];

    it("returns the most recent plannedQty for the work item, excluding the DPR currently open", () => {
      expect(getLatestPlannedQty(history, "civil_1", "dpr_3")).toBe(120);
    });

    it("returns undefined when there's no matching history", () => {
      expect(getLatestPlannedQty(history, "unknown_item", "dpr_3")).toBeUndefined();
    });
  });

  describe("getTotalManpower", () => {
    it("sums skilled and unskilled", () => {
      expect(getTotalManpower(5, 3)).toBe(8);
    });

    it("treats a missing/falsy count as 0 rather than NaN", () => {
      expect(getTotalManpower(0, 0)).toBe(0);
      expect(getTotalManpower(undefined as unknown as number, 4)).toBe(4);
    });
  });

  describe("getLineUom", () => {
    it("uses the master item's own uom for a normal row", () => {
      const master = { uom: "cum", isOtherCatchAll: false } as unknown as DPRWorkItemMaster;
      expect(getLineUom(master, undefined)).toBe("cum");
    });

    it("uses the free-text otherUom for one of the four 'Other ___ work' catch-all rows", () => {
      const master = { uom: "", isOtherCatchAll: true } as unknown as DPRWorkItemMaster;
      expect(getLineUom(master, "sq.m")).toBe("sq.m");
    });

    it("falls back to an em-dash when neither is available", () => {
      expect(getLineUom(undefined, undefined)).toBe("—");
      const master = { uom: "", isOtherCatchAll: true } as unknown as DPRWorkItemMaster;
      expect(getLineUom(master, undefined)).toBe("—");
    });
  });
});

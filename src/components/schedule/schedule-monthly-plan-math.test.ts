import { describe, expect, it } from "vitest";
import {
  formatMonthKey,
  getMonthKeysInRange,
  getMonthlyPlanTotal,
  getPlannedQuantityForMonth,
  validateMonthlyPlan,
} from "./schedule-monthly-plan-math";

describe("schedule-monthly-plan-math", () => {
  describe("getMonthKeysInRange", () => {
    it("returns a single key when start/end fall in the same month", () => {
      expect(getMonthKeysInRange("2026-08-05", "2026-08-25")).toEqual(["2026-08"]);
    });

    it("returns every month spanned, inclusive of both ends", () => {
      expect(getMonthKeysInRange("2026-07-01", "2026-08-15")).toEqual(["2026-07", "2026-08"]);
    });

    it("crosses a calendar year boundary correctly", () => {
      expect(getMonthKeysInRange("2026-12-01", "2027-01-15")).toEqual(["2026-12", "2027-01"]);
    });
  });

  describe("formatMonthKey", () => {
    it("formats a 'YYYY-MM' key as a short month + year", () => {
      const formatted = formatMonthKey("2026-08");
      expect(formatted).toMatch(/Aug/i);
      expect(formatted).toMatch(/2026/);
    });
  });

  describe("getMonthlyPlanTotal", () => {
    it("sums plannedQuantity across every entry", () => {
      expect(
        getMonthlyPlanTotal([
          { month: "2026-07", plannedQuantity: 350 },
          { month: "2026-08", plannedQuantity: 150 },
        ]),
      ).toBe(500);
    });

    it("is 0 for an empty plan", () => {
      expect(getMonthlyPlanTotal([])).toBe(0);
    });
  });

  describe("getPlannedQuantityForMonth", () => {
    const plan = [
      { month: "2026-07", plannedQuantity: 350 },
      { month: "2026-08", plannedQuantity: 150 },
    ];

    it("returns the quantity for a month that has one", () => {
      expect(getPlannedQuantityForMonth(plan, "2026-07")).toBe(350);
    });

    it("returns null (not 0) for a month with no entry", () => {
      expect(getPlannedQuantityForMonth(plan, "2026-09")).toBeNull();
    });
  });

  describe("validateMonthlyPlan", () => {
    it("is always valid for an empty plan ('not broken down yet')", () => {
      expect(validateMonthlyPlan(500, [])).toBeNull();
      expect(validateMonthlyPlan(0, [])).toBeNull();
    });

    it("is valid when non-empty entries sum to exactly the total quantity", () => {
      const plan = [
        { month: "2026-07", plannedQuantity: 350 },
        { month: "2026-08", plannedQuantity: 150 },
      ];
      expect(validateMonthlyPlan(500, plan)).toBeNull();
    });

    it("tolerates a tiny floating-point rounding difference", () => {
      const plan = [
        { month: "2026-07", plannedQuantity: 0.1 },
        { month: "2026-08", plannedQuantity: 0.2 },
      ];
      // 0.1 + 0.2 !== 0.3 in IEEE754 — this must still validate.
      expect(validateMonthlyPlan(0.3, plan)).toBeNull();
    });

    it("rejects a total that doesn't match the planned quantity", () => {
      const plan = [{ month: "2026-08", plannedQuantity: 100 }];
      const error = validateMonthlyPlan(500, plan);
      expect(error).not.toBeNull();
      expect(error).toMatch(/500/);
    });

    it("rejects a negative monthly entry outright", () => {
      const plan = [{ month: "2026-08", plannedQuantity: -10 }];
      expect(validateMonthlyPlan(-10, plan)).toMatch(/negative/i);
    });
  });
});

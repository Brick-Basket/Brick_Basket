import { describe, expect, it } from "vitest";
import {
  getTotalActual,
  getTotalBudget,
  getTotalVariance,
  getVariance,
  getVariancePercent,
  getVarianceStatus,
} from "./cost-math";
import type { CostEntry } from "@/types/domain/cost-entry";

describe("cost-math", () => {
  describe("getVariance", () => {
    it("is budget minus actual", () => {
      expect(getVariance(1000, 800)).toBe(200);
      expect(getVariance(1000, 1200)).toBe(-200);
      expect(getVariance(1000, 1000)).toBe(0);
    });
  });

  describe("getVariancePercent", () => {
    it("computes variance as a percentage of budget", () => {
      expect(getVariancePercent(1000, 800)).toBe(20);
      expect(getVariancePercent(1000, 1200)).toBe(-20);
    });

    it("guards against divide-by-zero, returning 0 rather than Infinity/NaN", () => {
      expect(getVariancePercent(0, 500)).toBe(0);
      expect(getVariancePercent(-100, 500)).toBe(0);
    });
  });

  describe("getVarianceStatus", () => {
    it("classifies over/under/on_budget correctly", () => {
      expect(getVarianceStatus(1000, 1200)).toBe("over");
      expect(getVarianceStatus(1000, 800)).toBe("under");
      expect(getVarianceStatus(1000, 1000)).toBe("on_budget");
    });
  });

  describe("aggregate totals", () => {
    const entries = [
      { budgetAmount: 1000, actualAmount: 800 },
      { budgetAmount: 2000, actualAmount: 2500 },
      { budgetAmount: 500, actualAmount: 500 },
    ] as unknown as CostEntry[];

    it("getTotalBudget sums every entry's budgetAmount", () => {
      expect(getTotalBudget(entries)).toBe(3500);
    });

    it("getTotalActual sums every entry's actualAmount", () => {
      expect(getTotalActual(entries)).toBe(3800);
    });

    it("getTotalVariance is total budget minus total actual", () => {
      expect(getTotalVariance(entries)).toBe(-300);
    });

    it("every aggregate returns 0 for an empty list rather than throwing", () => {
      expect(getTotalBudget([])).toBe(0);
      expect(getTotalActual([])).toBe(0);
      expect(getTotalVariance([])).toBe(0);
    });
  });
});

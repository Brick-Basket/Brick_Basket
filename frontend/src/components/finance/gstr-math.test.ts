import { describe, expect, it } from "vitest";
import { getTotalTax, getTotalTaxableValue, getTotalValue } from "./gstr-math";
import type { GSTRRecord } from "@/types/domain/gstr-record";

describe("gstr-math", () => {
  describe("getTotalValue", () => {
    it("sums taxable value and tax amount for one record", () => {
      expect(getTotalValue({ taxableValue: 1000, taxAmount: 180 })).toBe(1180);
    });

    it("handles a zero-tax record", () => {
      expect(getTotalValue({ taxableValue: 500, taxAmount: 0 })).toBe(500);
    });
  });

  describe("aggregate totals", () => {
    const records = [
      { taxableValue: 1000, taxAmount: 180 },
      { taxableValue: 2000, taxAmount: 360 },
      { taxableValue: 500, taxAmount: 90 },
    ] as unknown as GSTRRecord[];

    it("getTotalTaxableValue sums every record's taxableValue", () => {
      expect(getTotalTaxableValue(records)).toBe(3500);
    });

    it("getTotalTax sums every record's taxAmount", () => {
      expect(getTotalTax(records)).toBe(630);
    });

    it("both return 0 for an empty list", () => {
      expect(getTotalTaxableValue([])).toBe(0);
      expect(getTotalTax([])).toBe(0);
    });
  });
});

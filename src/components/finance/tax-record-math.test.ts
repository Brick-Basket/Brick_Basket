import { describe, expect, it } from "vitest";
import { getTaxRecordStatus, getTotalOverdue, getTotalPending } from "./tax-record-math";
import type { TaxRecord } from "@/types/domain/tax-record";

const asOf = new Date("2026-09-12T00:00:00");

describe("tax-record-math", () => {
  describe("getTaxRecordStatus", () => {
    it("is 'paid' whenever paidDate is set, regardless of dueDate", () => {
      expect(getTaxRecordStatus({ dueDate: "2026-01-01", paidDate: "2026-09-01" }, asOf)).toBe("paid");
      // Even a due date in the future — paid is paid.
      expect(getTaxRecordStatus({ dueDate: "2027-01-01", paidDate: "2026-01-01" }, asOf)).toBe("paid");
    });

    it("is 'overdue' when unpaid and past its due date", () => {
      expect(getTaxRecordStatus({ dueDate: "2026-08-01", paidDate: undefined }, asOf)).toBe("overdue");
    });

    it("is 'pending' when unpaid but not yet due", () => {
      expect(getTaxRecordStatus({ dueDate: "2026-10-01", paidDate: undefined }, asOf)).toBe("pending");
    });

    it("treats the due date itself as not yet overdue (strictly-after comparison)", () => {
      expect(getTaxRecordStatus({ dueDate: "2026-09-12", paidDate: undefined }, asOf)).toBe("pending");
    });
  });

  describe("aggregate totals", () => {
    const records = [
      { dueDate: "2026-08-01", paidDate: undefined, amount: 1000 }, // overdue
      { dueDate: "2026-10-01", paidDate: undefined, amount: 2000 }, // pending
      { dueDate: "2026-01-01", paidDate: "2026-01-15", amount: 500 }, // paid
    ] as unknown as TaxRecord[];

    it("getTotalPending sums every not-yet-paid record (pending + overdue)", () => {
      expect(getTotalPending(records, asOf)).toBe(3000);
    });

    it("getTotalOverdue sums only overdue records", () => {
      expect(getTotalOverdue(records, asOf)).toBe(1000);
    });

    it("both return 0 when everything is paid", () => {
      const allPaid = [{ dueDate: "2026-01-01", paidDate: "2026-01-15", amount: 500 }] as unknown as TaxRecord[];
      expect(getTotalPending(allPaid, asOf)).toBe(0);
      expect(getTotalOverdue(allPaid, asOf)).toBe(0);
    });
  });
});

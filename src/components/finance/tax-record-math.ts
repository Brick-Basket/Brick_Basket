import type { TaxRecord } from "@/types/domain/tax-record";

/**
 * Computed-at-render-time status for `TaxRecord` — never stored, the same
 * convention `ScheduleActivity`'s progress state (Part 13) and
 * `Invoice.paymentStatus` (Part 16) already established.
 */
export type TaxRecordStatus = "paid" | "pending" | "overdue";

export function getTaxRecordStatus(record: Pick<TaxRecord, "dueDate" | "paidDate">, asOf: Date = new Date()): TaxRecordStatus {
  if (record.paidDate) return "paid";
  const due = new Date(`${record.dueDate}T00:00:00`);
  return asOf > due ? "overdue" : "pending";
}

export function getTotalPending(records: TaxRecord[], asOf: Date = new Date()): number {
  return records.filter((r) => getTaxRecordStatus(r, asOf) !== "paid").reduce((sum, r) => sum + r.amount, 0);
}

export function getTotalOverdue(records: TaxRecord[], asOf: Date = new Date()): number {
  return records.filter((r) => getTaxRecordStatus(r, asOf) === "overdue").reduce((sum, r) => sum + r.amount, 0);
}

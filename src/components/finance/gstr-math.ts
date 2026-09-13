import type { GSTRRecord } from "@/types/domain/gstr-record";

/** Taxable value + tax — always computed at render time, never stored, the same convention every derived money total in this app follows. */
export function getTotalValue(record: Pick<GSTRRecord, "taxableValue" | "taxAmount">): number {
  return record.taxableValue + record.taxAmount;
}

export function getTotalTaxableValue(records: GSTRRecord[]): number {
  return records.reduce((sum, r) => sum + r.taxableValue, 0);
}

export function getTotalTax(records: GSTRRecord[]): number {
  return records.reduce((sum, r) => sum + r.taxAmount, 0);
}

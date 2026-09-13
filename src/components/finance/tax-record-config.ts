import type { TaxRecordType } from "@/types/domain/tax-record";
import type { TaxRecordStatus } from "@/components/finance/tax-record-math";

export const TAX_RECORD_TYPE_CONFIG: Record<TaxRecordType, { label: string }> = {
  tax: { label: "Government Tax" },
  statutory_license_fee: { label: "Statutory License Fee" },
};

export const TAX_RECORD_STATUS_CONFIG: Record<TaxRecordStatus, { label: string; variant: "success" | "warning" | "error" }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  overdue: { label: "Overdue", variant: "error" },
};

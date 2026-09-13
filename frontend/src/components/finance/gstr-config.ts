import type { GSTRRecordType } from "@/types/domain/gstr-record";

export const GSTR_TYPE_CONFIG: Record<GSTRRecordType, { label: string; variant: "brand" | "success" }> = {
  purchase: { label: "Purchase", variant: "brand" },
  sales: { label: "Sales", variant: "success" },
};

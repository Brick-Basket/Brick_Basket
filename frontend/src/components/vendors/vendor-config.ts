import type {
  VendorCodeSeriesCategory,
  VendorDocumentType,
  VendorGSTCategory,
  VendorNature,
  VendorPastWorkStatus,
} from "@/types/domain/vendor";

/** Owner-specified verbatim ("Nature: Supply / Service / Service & Supply"). */
export const VENDOR_NATURE_CONFIG: Record<VendorNature, { label: string }> = {
  supply: { label: "Supply" },
  service: { label: "Service" },
  service_and_supply: { label: "Service & Supply" },
};

export const VENDOR_NATURE_ORDER: VendorNature[] = ["supply", "service", "service_and_supply"];

/** Owner-specified verbatim ("GST category: Registered / Non-Registered"). */
export const VENDOR_GST_CATEGORY_CONFIG: Record<VendorGSTCategory, { label: string }> = {
  registered: { label: "Registered" },
  non_registered: { label: "Non-Registered" },
};

export const VENDOR_GST_CATEGORY_ORDER: VendorGSTCategory[] = ["registered", "non_registered"];

/**
 * Vendor code series — see `src/types/domain/vendor.ts`'s header comment
 * for why this is a separate field from `nature`. Series 1–5 all start at
 * a six-digit number per the owner requirements. Series 6 was originally
 * written as "60001+" in the owner text (five digits) — inconsistent with
 * the other five — and docs/OPEN_QUESTIONS.md #1 had been resolved in favor
 * of that literal five-digit text. The owner has since corrected this
 * directly in the running app: Series 6 should be six digits (600001+)
 * like every other series. `startingNumber` now reflects that; see
 * docs/OPEN_QUESTIONS.md #1 for the updated resolution.
 */
export const VENDOR_CODE_SERIES_CONFIG: Record<
  VendorCodeSeriesCategory,
  { seriesNumber: number; label: string; startingNumber: number; ownerExampleText: string }
> = {
  service_and_supply: { seriesNumber: 1, label: "Service & Supply", startingNumber: 100_001, ownerExampleText: "100001+" },
  service: { seriesNumber: 2, label: "Service", startingNumber: 200_001, ownerExampleText: "200001+" },
  supply: { seriesNumber: 3, label: "Supply", startingNumber: 300_001, ownerExampleText: "300001+" },
  specialised_work: { seriesNumber: 4, label: "Specialised Work", startingNumber: 400_001, ownerExampleText: "400001+" },
  machinery_hiring: { seriesNumber: 5, label: "Machinery Hiring", startingNumber: 500_001, ownerExampleText: "500001+" },
  design_detailing_consultancy: {
    seriesNumber: 6,
    label: "Design / Detailing / Consultancy",
    startingNumber: 600_001,
    ownerExampleText: "600001+",
  },
};

export const VENDOR_CODE_SERIES_ORDER: VendorCodeSeriesCategory[] = [
  "service_and_supply",
  "service",
  "supply",
  "specialised_work",
  "machinery_hiring",
  "design_detailing_consultancy",
];

/** Assigns the next sequential code within `category`'s series given every existing vendor code. */
export function assignVendorCode(category: VendorCodeSeriesCategory, existingCodes: string[]): string {
  const config = VENDOR_CODE_SERIES_CONFIG[category];
  const prefix = String(config.startingNumber)[0];
  const seriesLength = String(config.startingNumber).length;
  const numericCodes = existingCodes
    .filter((code) => code.length === seriesLength && code.startsWith(prefix ?? ""))
    .map((code) => Number(code))
    .filter((n) => n >= config.startingNumber && n < config.startingNumber + 90_000);

  const next = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : config.startingNumber;
  return String(next);
}

/**
 * Document 2 correction: vendor document attachment types — "selecting
 * the type of document" (PAN card / GSTIN certificate / MSME/UDYAM
 * certificate / other). See `VendorDocument` in
 * `src/types/domain/vendor.ts` and docs/OPEN_QUESTIONS.md #82.
 */
export const VENDOR_DOCUMENT_TYPE_CONFIG: Record<VendorDocumentType, { label: string }> = {
  pan_card: { label: "PAN Card" },
  gstin_certificate: { label: "GSTIN Certificate" },
  msme_udyam_certificate: { label: "MSME/UDYAM Certificate" },
  other: { label: "Other" },
};

export const VENDOR_DOCUMENT_TYPE_ORDER: VendorDocumentType[] = ["pan_card", "gstin_certificate", "msme_udyam_certificate", "other"];

/**
 * Document 2 correction: past-work "completed" vs. "under progress"
 * status — see `VendorPastWorkEntry` in `src/types/domain/vendor.ts`.
 */
export const VENDOR_PAST_WORK_STATUS_CONFIG: Record<VendorPastWorkStatus, { label: string; badgeVariant: "success" | "warning" }> = {
  completed: { label: "Completed", badgeVariant: "success" },
  in_progress: { label: "Under Progress", badgeVariant: "warning" },
};

export const VENDOR_PAST_WORK_STATUS_ORDER: VendorPastWorkStatus[] = ["completed", "in_progress"];

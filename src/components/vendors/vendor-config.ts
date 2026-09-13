import type { VendorCodeSeriesCategory, VendorGSTCategory, VendorNature } from "@/types/domain/vendor";

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
 * a six-digit number per the owner requirements; Series 6 is written as
 * "60001+" in the owner text (five digits) — inconsistent with the other
 * five. Rather than silently "fix" that, `startingNumber` here uses the
 * six-digit pattern (600001) for a working, internally-consistent demo,
 * while `ownerExampleText` preserves exactly what the owner wrote. See
 * docs/OPEN_QUESTIONS.md #1 — resolve there, not by editing this file
 * quietly, once the client confirms which was intended.
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
    ownerExampleText: "60001+", // verbatim from the owner text — see docs/OPEN_QUESTIONS.md #1
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

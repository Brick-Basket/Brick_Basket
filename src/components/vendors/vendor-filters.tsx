"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import {
  VENDOR_CODE_SERIES_CONFIG,
  VENDOR_CODE_SERIES_ORDER,
  VENDOR_GST_CATEGORY_CONFIG,
  VENDOR_GST_CATEGORY_ORDER,
  VENDOR_NATURE_CONFIG,
  VENDOR_NATURE_ORDER,
} from "@/components/vendors/vendor-config";
import type { VendorListParams } from "@/lib/api/adapters/vendors-adapter";
import type { VendorCodeSeriesCategory, VendorGSTCategory, VendorNature } from "@/types/domain/vendor";

/** "Filters by nature/category" per the owner requirements — nature (3-value) and code series category (6-value) are separate filters, matching the two separate fields. See `src/types/domain/vendor.ts`. */
export function VendorFilters({ value, onChange }: { value: VendorListParams; onChange: (next: VendorListParams) => void }) {
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search trade name, code, or contact…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search vendors"
      />
      <Select
        value={value.nature ?? ""}
        onChange={(e) => onChange({ ...value, nature: (e.target.value as VendorNature) || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by nature"
      >
        <option value="">All natures</option>
        {VENDOR_NATURE_ORDER.map((n) => (
          <option key={n} value={n}>
            {VENDOR_NATURE_CONFIG[n].label}
          </option>
        ))}
      </Select>
      <Select
        value={value.codeSeriesCategory ?? ""}
        onChange={(e) => onChange({ ...value, codeSeriesCategory: (e.target.value as VendorCodeSeriesCategory) || undefined, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Filter by code series category"
      >
        <option value="">All categories</option>
        {VENDOR_CODE_SERIES_ORDER.map((c) => (
          <option key={c} value={c}>
            Series {VENDOR_CODE_SERIES_CONFIG[c].seriesNumber} — {VENDOR_CODE_SERIES_CONFIG[c].label}
          </option>
        ))}
      </Select>
      <Select
        value={value.gstCategory ?? ""}
        onChange={(e) => onChange({ ...value, gstCategory: (e.target.value as VendorGSTCategory) || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by GST category"
      >
        <option value="">All GST categories</option>
        {VENDOR_GST_CATEGORY_ORDER.map((g) => (
          <option key={g} value={g}>
            {VENDOR_GST_CATEGORY_CONFIG[g].label}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

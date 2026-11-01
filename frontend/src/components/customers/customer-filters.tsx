"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";

export interface CustomerFiltersValue {
  search?: string;
  /** "all" | "lead" (has a `leadId`) | "direct" (no `leadId`) — client-side only, see customer-table.tsx's `source` column. */
  source?: "lead" | "direct";
}

/**
 * Client-side filter bar — unlike `VendorFilters`, these don't round-trip to
 * `CustomersAdapter.list()` (it takes no params; see its doc comment in
 * `customers-adapter.ts`). The `/admin/customers` list page filters the
 * already-fetched customer list in memory. Fine at today's data volume —
 * flagged in docs/OPEN_QUESTIONS.md as a follow-up if/when a real backend
 * paginates this list server-side.
 */
export function CustomerFilters({ value, onChange }: { value: CustomerFiltersValue; onChange: (next: CustomerFiltersValue) => void }) {
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search name, email, or phone…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        className="w-full sm:w-64"
        aria-label="Search customers"
      />
      <Select
        value={value.source ?? ""}
        onChange={(e) => onChange({ ...value, source: (e.target.value as "lead" | "direct") || undefined })}
        className="w-full sm:w-48"
        aria-label="Filter by source"
      >
        <option value="">All sources</option>
        <option value="lead">From Lead</option>
        <option value="direct">Direct</option>
      </Select>
    </FilterBar>
  );
}

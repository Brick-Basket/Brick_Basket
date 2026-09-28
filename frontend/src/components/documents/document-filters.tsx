"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { DOCUMENT_CATEGORY_CONFIG, DOCUMENT_CATEGORY_ORDER } from "@/components/documents/document-category-config";
import type { DocumentListParams } from "@/lib/api/adapters/documents-adapter";
import type { DocumentCategory } from "@/types/domain/document";

/**
 * Filters within a single contract's document list
 * (`/admin/documents/[contractId]`, and the customer dashboard's Documents
 * screen). The project picker this used to have is gone — every document
 * list here is already scoped to one contract (owner correction #3), so
 * filtering by project no longer applies; city/contract-reference/package
 * filtering now lives one level up, on the Contract Directory
 * (`ContractDirectoryFilters`, owner correction #5).
 */
export function DocumentFilters({
  value,
  onChange,
}: {
  value: DocumentListParams;
  onChange: (next: DocumentListParams) => void;
}) {
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search title or file name…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search documents"
      />
      <Select
        value={value.category ?? ""}
        onChange={(e) => onChange({ ...value, category: (e.target.value as DocumentCategory) || undefined, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {DOCUMENT_CATEGORY_ORDER.map((cat) => (
          <option key={cat} value={cat}>
            {DOCUMENT_CATEGORY_CONFIG[cat].label}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

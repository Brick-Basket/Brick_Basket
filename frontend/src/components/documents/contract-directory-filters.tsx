"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { CONTRACT_CATEGORY_TYPE_CONFIG, CONTRACT_CATEGORY_TYPE_ORDER } from "@/components/contracts/contract-category-type-config";
import type { ContractCategoryType } from "@/types/domain/contract";

export interface ContractDirectoryFilterValues {
  search: string;
  city: string;
  contractCategory: ContractCategoryType | "";
}

/**
 * Filters for the Documents module's Contract Directory (`/admin/documents`)
 * — owner correction #5: "There should be filter for city name, contract
 * reference number & type of package." Contract reference number is
 * covered by the search box (it already matches `contractNumber`, title,
 * and city — see `ContractsAdapter.list`); city and "type of package"
 * (the contract-level category — IHB/Large Construction/Special Services,
 * the closest owner-named "package" concept — see docs/OPEN_QUESTIONS.md)
 * get their own selects.
 */
export function ContractDirectoryFilters({
  value,
  cities,
  onChange,
}: {
  value: ContractDirectoryFilterValues;
  cities: string[];
  onChange: (next: ContractDirectoryFilterValues) => void;
}) {
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search contract number, title, or city…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        className="w-full sm:w-72"
        aria-label="Search contracts"
      />
      <Select
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        className="w-full sm:w-48"
        aria-label="Filter by city"
      >
        <option value="">All cities</option>
        {cities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </Select>
      <Select
        value={value.contractCategory}
        onChange={(e) => onChange({ ...value, contractCategory: e.target.value as ContractCategoryType | "" })}
        className="w-full sm:w-56"
        aria-label="Filter by type of package"
      >
        <option value="">All package/contract types</option>
        {CONTRACT_CATEGORY_TYPE_ORDER.map((cat) => (
          <option key={cat} value={cat}>
            {CONTRACT_CATEGORY_TYPE_CONFIG[cat].label}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

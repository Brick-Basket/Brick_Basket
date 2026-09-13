"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { useProjects } from "@/hooks/use-projects";
import type { BankTransactionListParams } from "@/lib/api/adapters/bank-adapter";

/** Search + project filter for `/admin/finance/bank-cash`. */
export function BankTransactionFilters({
  value,
  onChange,
}: {
  value: BankTransactionListParams;
  onChange: (next: BankTransactionListParams) => void;
}) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search party/vendor code or invoice number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-72"
        aria-label="Search bank & cash entries"
      />
      <Select
        value={value.projectId ?? ""}
        onChange={(e) => onChange({ ...value, projectId: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by project"
      >
        <option value="">All projects</option>
        {allProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

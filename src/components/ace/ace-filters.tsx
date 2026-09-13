"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { CONTRACT_CATEGORY_CONFIG, CONTRACT_CATEGORY_ORDER } from "@/components/contracts/contract-category-config";
import { useProjects } from "@/hooks/use-projects";
import type { ACEListParams } from "@/lib/api/adapters/ace-adapter";
import type { ContractCategory } from "@/types/domain/contract";

/** "Category filters" + "Project association" per the owner requirements. */
export function ACEFilters({ value, onChange }: { value: ACEListParams; onChange: (next: ACEListParams) => void }) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search item description…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search ACE items"
      />
      <Select
        value={value.category ?? ""}
        onChange={(e) => onChange({ ...value, category: (e.target.value as ContractCategory) || undefined, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {CONTRACT_CATEGORY_ORDER.map((cat) => (
          <option key={cat} value={cat}>
            {CONTRACT_CATEGORY_CONFIG[cat].label}
          </option>
        ))}
      </Select>
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

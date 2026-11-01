"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { CONTRACT_CATEGORY_CONFIG, CONTRACT_CATEGORY_ORDER } from "@/components/contracts/contract-category-config";
import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "@/components/providers/project-provider";
import type { CostListParams } from "@/lib/api/adapters/cost-adapter";
import type { ContractCategory } from "@/types/domain/contract";

/**
 * Category + project filters for the Project Cost Accounting list,
 * mirroring `ACEFilters`.
 *
 * BrickBasket "Global Project Selector" correction: picking a specific
 * project here now also updates the shared `ProjectProvider` selection,
 * the same one-way-on-pick pattern `DPRFilters` uses — "All projects"
 * stays a real, supported view and does not clear the shared selection.
 */
export function CostFilters({ value, onChange }: { value: CostListParams; onChange: (next: CostListParams) => void }) {
  const { projects: allProjects } = useProjects();
  const { setSelectedId } = useProjectContext();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search category or notes…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search cost entries"
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
        onChange={(e) => {
          const projectId = e.target.value || undefined;
          onChange({ ...value, projectId, page: 1 });
          if (projectId) setSelectedId(projectId);
        }}
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

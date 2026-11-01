"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { STOCK_MATERIAL_CONFIG, STOCK_MATERIAL_ORDER } from "@/components/stock/stock-material-config";
import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "@/components/providers/project-provider";
import type { WastageListParams } from "@/lib/api/adapters/wastage-adapter";
import type { StockMaterial } from "@/types/domain/stock-entry";

/**
 * BrickBasket "Global Project Selector" correction: picking a specific
 * project here now also updates the shared `ProjectProvider` selection,
 * the same one-way-on-pick pattern `DPRFilters` uses — "All projects"
 * stays a real, supported view and does not clear the shared selection.
 */
export function WastageFilters({ value, onChange }: { value: WastageListParams; onChange: (next: WastageListParams) => void }) {
  const { projects: allProjects } = useProjects();
  const { setSelectedId } = useProjectContext();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search material or reason…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search wastage entries"
      />
      <Select
        value={value.material ?? ""}
        onChange={(e) => onChange({ ...value, material: (e.target.value as StockMaterial) || undefined, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by material"
      >
        <option value="">All materials</option>
        {STOCK_MATERIAL_ORDER.map((m) => (
          <option key={m} value={m}>
            {STOCK_MATERIAL_CONFIG[m].label}
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

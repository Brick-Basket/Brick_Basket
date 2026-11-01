"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "@/components/providers/project-provider";
import type { GRNListParams } from "@/lib/api/adapters/grn-adapter";

/**
 * "Project scope" filter per the owner requirements, plus a GRN-number
 * search.
 *
 * BrickBasket "Global Project Selector" correction: picking a specific
 * project here now also updates the shared `ProjectProvider` selection,
 * the same one-way-on-pick pattern `DPRFilters` uses — "All projects"
 * stays a real, supported view and does not clear the shared selection.
 */
export function GRNFilters({ value, onChange }: { value: GRNListParams; onChange: (next: GRNListParams) => void }) {
  const { projects: allProjects } = useProjects();
  const { setSelectedId } = useProjectContext();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search GRN number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search GRNs"
      />
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

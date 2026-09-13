"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { useProjects } from "@/hooks/use-projects";
import type { GSTRListParams } from "@/lib/api/adapters/gstr-adapter";

/**
 * Search + project filter for `/admin/finance/gstr`. No type filter here
 * — the page's Purchase/Sales tabs already pin `type` in the list params.
 */
export function GSTRFilters({
  value,
  onChange,
}: {
  value: GSTRListParams;
  onChange: (next: GSTRListParams) => void;
}) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search invoice reference, description, or GSTIN…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-72"
        aria-label="Search GSTR records"
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

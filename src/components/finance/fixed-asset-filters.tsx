"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { FIXED_ASSET_CATEGORY_CONFIG } from "@/components/finance/fixed-asset-config";
import { useProjects } from "@/hooks/use-projects";
import type { FixedAssetListParams } from "@/lib/api/adapters/fixed-assets-adapter";

/** Search + category/project filters for `/admin/finance/fixed-assets`. */
export function FixedAssetFilters({
  value,
  onChange,
}: {
  value: FixedAssetListParams;
  onChange: (next: FixedAssetListParams) => void;
}) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search asset name or serial number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-72"
        aria-label="Search fixed assets"
      />
      <Select
        value={value.category ?? ""}
        onChange={(e) => onChange({ ...value, category: (e.target.value || undefined) as FixedAssetListParams["category"], page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {Object.entries(FIXED_ASSET_CATEGORY_CONFIG).map(([value_, cfg]) => (
          <option key={value_} value={value_}>
            {cfg.label}
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

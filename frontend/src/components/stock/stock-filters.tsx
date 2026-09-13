"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { STOCK_MATERIAL_CONFIG, STOCK_MATERIAL_ORDER } from "@/components/stock/stock-material-config";
import { useProjects } from "@/hooks/use-projects";
import type { StockListParams } from "@/lib/api/adapters/stock-adapter";
import type { StockMaterial } from "@/types/domain/stock-entry";

export function StockFilters({ value, onChange }: { value: StockListParams; onChange: (next: StockListParams) => void }) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search material or supplier…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search stock entries"
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

"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { TAX_RECORD_TYPE_CONFIG } from "@/components/finance/tax-record-config";
import { useProjects } from "@/hooks/use-projects";
import type { TaxRecordListParams } from "@/lib/api/adapters/tax-records-adapter";

/** Search + type/project filters for `/admin/finance/taxes`. */
export function TaxRecordFilters({
  value,
  onChange,
}: {
  value: TaxRecordListParams;
  onChange: (next: TaxRecordListParams) => void;
}) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search name or authority…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-72"
        aria-label="Search tax records"
      />
      <Select
        value={value.type ?? ""}
        onChange={(e) => onChange({ ...value, type: (e.target.value || undefined) as TaxRecordListParams["type"], page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by type"
      >
        <option value="">All types</option>
        {Object.entries(TAX_RECORD_TYPE_CONFIG).map(([value_, cfg]) => (
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

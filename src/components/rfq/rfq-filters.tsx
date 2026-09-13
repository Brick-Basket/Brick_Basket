"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { RFQ_STATUS_CONFIG, RFQ_STATUS_ORDER } from "@/components/rfq/rfq-status-config";
import { useProjects } from "@/hooks/use-projects";
import type { RFQListParams } from "@/lib/api/adapters/rfq-adapter";
import type { RFQStatus } from "@/types/domain/rfq";

export function RFQFilters({ value, onChange }: { value: RFQListParams; onChange: (next: RFQListParams) => void }) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search RFQ number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search RFQs"
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
      <Select
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: (e.target.value as RFQStatus) || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {RFQ_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {RFQ_STATUS_CONFIG[s].label}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

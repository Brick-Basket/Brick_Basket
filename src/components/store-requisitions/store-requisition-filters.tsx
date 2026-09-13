"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { useProjects } from "@/hooks/use-projects";
import { STORE_REQUISITION_STATUS_CONFIG, STORE_REQUISITION_STATUS_ORDER } from "@/components/store-requisitions/store-requisition-status-config";
import type { StoreRequisitionListParams } from "@/lib/api/adapters/store-requisitions-adapter";
import type { StoreRequisitionStatus } from "@/types/domain/store-requisition";

export function StoreRequisitionFilters({
  value,
  onChange,
}: {
  value: StoreRequisitionListParams;
  onChange: (next: StoreRequisitionListParams) => void;
}) {
  const { projects } = useProjects();

  return (
    <FilterBar>
      <SearchInput
        placeholder="Search request number or remarks…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search Store Material Requisitions"
      />
      <Select
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: (e.target.value as StoreRequisitionStatus) || undefined, page: 1 })}
        className="w-full sm:w-44"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STORE_REQUISITION_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STORE_REQUISITION_STATUS_CONFIG[s].label}
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
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

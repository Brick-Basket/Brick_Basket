"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { REQUISITION_STATUS_CONFIG, REQUISITION_STATUS_ORDER } from "@/components/requisitions/requisition-status-config";
import { useProjects } from "@/hooks/use-projects";
import type { RequisitionListParams } from "@/lib/api/adapters/requisitions-adapter";
import type { PurchaseRequisitionStatus } from "@/types/domain/requisition";

export function RequisitionFilters({ value, onChange }: { value: RequisitionListParams; onChange: (next: RequisitionListParams) => void }) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search requisition number or notes…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search requisitions"
      />
      <Select
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: (e.target.value as PurchaseRequisitionStatus) || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {REQUISITION_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {REQUISITION_STATUS_CONFIG[s].label}
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

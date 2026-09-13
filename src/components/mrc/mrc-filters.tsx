"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { MRC_STATUS_CONFIG } from "@/components/mrc/mrc-status-config";
import { useProjects } from "@/hooks/use-projects";
import type { MRCListParams } from "@/lib/api/adapters/mrc-adapter";
import type { Customer } from "@/types/domain/customer";
import type { MRCStatus } from "@/types/domain/mrc";

const STATUS_ORDER: MRCStatus[] = ["draft", "issued", "accepted", "declined"];

export function MRCFilters({
  value,
  customers,
  onChange,
}: {
  value: MRCListParams;
  customers: Customer[];
  onChange: (next: MRCListParams) => void;
}) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search MRC number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search MRCs"
      />
      <Select
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: (e.target.value as MRCStatus) || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {MRC_STATUS_CONFIG[s].label}
          </option>
        ))}
      </Select>
      <Select
        value={value.customerId ?? ""}
        onChange={(e) => onChange({ ...value, customerId: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by customer"
      >
        <option value="">All customers</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Select
        value={value.projectId ?? ""}
        onChange={(e) => onChange({ ...value, projectId: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-56"
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

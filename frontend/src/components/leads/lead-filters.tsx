"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { assignableStaffDirectory } from "@/lib/auth/mock-users";
import { LEAD_SOURCE_CONFIG } from "@/components/leads/lead-source-config";
import { LEAD_STATUS_ORDER, LEAD_STATUS_CONFIG } from "@/components/leads/lead-status-config";
import type { LeadListParams } from "@/lib/api/adapters/leads-adapter";

export function LeadFilters({
  value,
  onChange,
}: {
  value: LeadListParams;
  onChange: (next: LeadListParams) => void;
}) {
  const staff = assignableStaffDirectory();

  return (
    <FilterBar>
      <SearchInput
        placeholder="Search name, email, phone, subject…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search leads"
      />
      <Select
        value={value.source ?? ""}
        onChange={(e) => onChange({ ...value, source: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by source"
      >
        <option value="">All sources</option>
        {Object.entries(LEAD_SOURCE_CONFIG).map(([key, cfg]) => (
          <option key={key} value={key}>
            {cfg.label}
          </option>
        ))}
      </Select>
      <Select
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-40"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {LEAD_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_CONFIG[s].label}
          </option>
        ))}
      </Select>
      <Select
        value={value.assignedTo ?? ""}
        onChange={(e) => onChange({ ...value, assignedTo: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by assignee"
      >
        <option value="">Everyone</option>
        <option value="unassigned">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

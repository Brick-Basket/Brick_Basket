"use client";

import { X } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/domain/filter-bar";
import { CityAutocomplete } from "@/components/ui/city-autocomplete";
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
        placeholder="Search name, email, phone, city, subject…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search leads"
      />
      {/* Dedicated city-selection filter (owner correction #5 follow-up: "in
          searchbar, city selection option should be there to easily access
          all the cities") — separate from the free-text search above, and
          backed by the same curated Indian-city list used on the New Lead
          form, so staff can pick a city instead of typing it out in full. */}
      <div className="relative w-full sm:w-56">
        <CityAutocomplete
          value={value.city ?? ""}
          placeholder="Filter by city…"
          ariaLabel="Filter by city"
          onValueChange={(v) => onChange({ ...value, city: v || undefined, page: 1 })}
          onSelectCity={(c) => onChange({ ...value, city: c.city, page: 1 })}
        />
        {value.city && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...value, city: undefined, page: 1 })}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
            aria-label="Clear city filter"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </Button>
        )}
      </div>
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
        <option value="">All status</option>
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

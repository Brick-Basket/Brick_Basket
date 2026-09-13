"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FilterBar } from "@/components/domain/filter-bar";
import { useProjects } from "@/hooks/use-projects";
import type { DPRListParams } from "@/lib/api/adapters/dpr-adapter";

/**
 * Filter bar for the admin DPR list — unlike `ScheduleFilters` (Part 13),
 * DPRs are browsed across every project by default (an "All projects"
 * option), since a Project Manager overseeing several sites wants one
 * combined daily-report list, filterable down to one project and/or a date
 * range. Mirrors `GRNFilters` (Part 12) in shape.
 */
export function DPRFilters({ value, onChange }: { value: DPRListParams; onChange: (next: DPRListParams) => void }) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search DPR number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search DPRs"
      />
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
      <Input
        type="date"
        value={value.dateFrom ?? ""}
        onChange={(e) => onChange({ ...value, dateFrom: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-40"
        aria-label="From date"
      />
      <Input
        type="date"
        value={value.dateTo ?? ""}
        onChange={(e) => onChange({ ...value, dateTo: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-40"
        aria-label="To date"
      />
    </FilterBar>
  );
}

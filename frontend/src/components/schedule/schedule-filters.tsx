"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { useProjects } from "@/hooks/use-projects";
import type { ScheduleListParams } from "@/lib/api/adapters/schedule-adapter";

/**
 * Unlike every other module's filter bar, `projectId` here has no "All
 * projects" option — a Gantt chart mixing several projects' unrelated
 * date ranges into one timeline wouldn't read as a schedule for anyone.
 * The page always keeps exactly one project selected.
 */
export function ScheduleFilters({ value, onChange }: { value: ScheduleListParams; onChange: (next: ScheduleListParams) => void }) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <Select
        value={value.projectId ?? ""}
        onChange={(e) => onChange({ ...value, projectId: e.target.value, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Select project"
      >
        {allProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <SearchInput
        placeholder="Search activity…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search activities"
      />
    </FilterBar>
  );
}

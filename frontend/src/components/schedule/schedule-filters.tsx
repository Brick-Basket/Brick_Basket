"use client";

import { SearchInput } from "@/components/ui/search-input";
import { FilterBar } from "@/components/domain/filter-bar";
import { ProjectSelector } from "@/components/shell/project-selector";
import type { ScheduleListParams } from "@/lib/api/adapters/schedule-adapter";

/**
 * BrickBasket "Project Management Navigation and Persistent Project
 * Selection" correction: this used to render its own project `<Select>`,
 * disconnected from every other module's project choice — exactly the
 * repeated-selection problem the correction targets. It now renders the
 * shared `ProjectSelector` (src/components/shell/project-selector.tsx,
 * backed by `ProjectProvider`) instead: the same control Schedule, DPR and
 * Site Updates all use, so picking a project once here carries over to the
 * other two. The parent page (`AdminScheduleContent`) reads the shared
 * selection and keeps `value.projectId` in sync with it — this component
 * no longer owns project switching itself.
 *
 * Still true, and still why this is the one module with no "All projects"
 * option: a Gantt chart mixing several projects' unrelated date ranges
 * into one timeline wouldn't read as a schedule for anyone. The page
 * always keeps exactly one project in view.
 */
export function ScheduleFilters({ value, onChange }: { value: ScheduleListParams; onChange: (next: ScheduleListParams) => void }) {
  return (
    <FilterBar>
      <ProjectSelector />
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

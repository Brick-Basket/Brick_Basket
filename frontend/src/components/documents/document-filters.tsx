"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { DOCUMENT_CATEGORY_CONFIG, DOCUMENT_CATEGORY_ORDER } from "@/components/documents/document-category-config";
import { useProjects } from "@/hooks/use-projects";
import type { DocumentListParams } from "@/lib/api/adapters/documents-adapter";
import type { DocumentCategory } from "@/types/domain/document";

export function DocumentFilters({
  value,
  showProjectFilter = true,
  onChange,
}: {
  value: DocumentListParams;
  showProjectFilter?: boolean;
  onChange: (next: DocumentListParams) => void;
}) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search title or file name…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search documents"
      />
      <Select
        value={value.category ?? ""}
        onChange={(e) => onChange({ ...value, category: (e.target.value as DocumentCategory) || undefined, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {DOCUMENT_CATEGORY_ORDER.map((cat) => (
          <option key={cat} value={cat}>
            {DOCUMENT_CATEGORY_CONFIG[cat].label}
          </option>
        ))}
      </Select>
      {showProjectFilter && (
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
      )}
    </FilterBar>
  );
}

"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { PO_STATUS_CONFIG, PO_STATUS_ORDER } from "@/components/po/po-status-config";
import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "@/components/providers/project-provider";
import type { PurchaseOrderListParams } from "@/lib/api/adapters/purchase-orders-adapter";
import type { PurchaseOrderStatus } from "@/types/domain/purchase-order";

/**
 * BrickBasket "Global Project Selector" correction: picking a specific
 * project here now also updates the shared `ProjectProvider` selection,
 * the same one-way-on-pick pattern `DPRFilters` uses — "All projects"
 * stays a real, supported view and does not clear the shared selection.
 */
export function POFilters({ value, onChange }: { value: PurchaseOrderListParams; onChange: (next: PurchaseOrderListParams) => void }) {
  const { projects: allProjects } = useProjects();
  const { setSelectedId } = useProjectContext();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search PO number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search Purchase Orders"
      />
      <Select
        value={value.projectId ?? ""}
        onChange={(e) => {
          const projectId = e.target.value || undefined;
          onChange({ ...value, projectId, page: 1 });
          if (projectId) setSelectedId(projectId);
        }}
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
        onChange={(e) => onChange({ ...value, status: (e.target.value as PurchaseOrderStatus) || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {PO_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {PO_STATUS_CONFIG[s].label}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

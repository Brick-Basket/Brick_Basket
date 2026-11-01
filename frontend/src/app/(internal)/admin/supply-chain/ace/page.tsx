"use client";

import { useEffect, useRef, useState } from "react";
import { Download, LayoutGrid, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { usePermission } from "@/lib/permissions/use-permission";
import { useACEItems } from "@/hooks/use-ace";
import { useProjects } from "@/hooks/use-projects";
import { useProjectContext } from "@/components/providers/project-provider";
import { ACEFilters } from "@/components/ace/ace-filters";
import { ACETable } from "@/components/ace/ace-table";
import { ACEForm } from "@/components/ace/ace-form";
import { CONTRACT_CATEGORY_CONFIG } from "@/components/contracts/contract-category-config";
import { ACE_UOM_CONFIG } from "@/components/ace/ace-uom-config";
import { aceAdapter } from "@/lib/api/adapters/ace-adapter";
import { downloadCsv } from "@/lib/utils/export-csv";
import type { ACEItem } from "@/types/domain/ace-item";
import type { ACEListParams } from "@/lib/api/adapters/ace-adapter";

const PAGE_SIZE = 10;
/**
 * FRONTEND IMPLEMENTATION DECISION: the grouped-by-category view (see
 * `ACETable`) needs every matching item in hand at once to group correctly
 * — grouping only the current 10-row page would split one category across
 * several pages instead of showing it as one section. Rather than paginate
 * groups themselves (which real cost-estimate/BOQ tools don't do either —
 * they scroll a long sheet, they don't page it), grouped mode fetches up
 * to this many matching rows in one call and relies on collapsible groups
 * + the table's own frozen-header scroll box (`DataTable`/`ACETable`,
 * capped at 70vh) instead of `Pagination`. 500 comfortably covers this
 * mock dataset; a real backend serving far more ACE items than that would
 * want a dedicated "grouped/summary" endpoint rather than a bigger page
 * size — not needed today.
 */
const GROUPED_FETCH_SIZE = 500;

export default function AdminACEPage() {
  return (
    <PermissionGuard
      permission="ace:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Accepted Cost Estimate" />
        </div>
      }
    >
      <AdminACEContent />
    </PermissionGuard>
  );
}

function AdminACEContent() {
  const canWrite = usePermission("ace:write");
  const [filters, setFilters] = useState<ACEListParams>({ page: 1, pageSize: PAGE_SIZE, sortBy: "itemDescription", sortDir: "asc" });
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ACEItem | null>(null);
  // Grouped-by-category is the default presentation — see ACETable's own
  // header comment for why (matches how comparable cost-estimate/BOQ
  // screens elsewhere in the market organize line items, and Excel's own
  // "Group/Outline" convention). Kept as a one-click toggle back to the
  // original flat, single sortable list for anyone who prefers it.
  const [grouped, setGrouped] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { projects: allProjects } = useProjects();

  // BrickBasket "Global Project Selector" correction: this page's own
  // project filter follows the shared `ProjectProvider` selection (the
  // admin topbar's global selector) on every change — not just once on
  // load — so switching the project in the header while already on this
  // page actually does something, instead of silently requiring a
  // navigate-away-and-back. That following stops the moment the user
  // touches this page's own project filter directly (picking a specific
  // project OR "All projects" — both count, see the wrapped `onChange`
  // below): from then on this page's filter is independently the user's
  // own choice for the rest of this visit, exactly the "All projects
  // stays a real, sticky view" guarantee `ACEFilters` already documents.
  // A fresh visit (this component remounts on navigation) always
  // re-seeds from whatever is currently shared.
  const { selected } = useProjectContext();
  const userOverrodeProjectRef = useRef(false);
  useEffect(() => {
    if (userOverrodeProjectRef.current) return;
    if (selected) {
      setFilters((prev) => (prev.projectId === selected.id ? prev : { ...prev, projectId: selected.id }));
    }
  }, [selected]);
  const handleFiltersChange = (next: ACEListParams) => {
    if (next.projectId !== filters.projectId) userOverrodeProjectRef.current = true;
    setFilters(next);
  };
  // Grouped mode fetches the whole matching set (see `GROUPED_FETCH_SIZE`)
  // and ignores `filters.page`; flat mode is the original, real 10-per-page
  // fetch. Only the fetch params differ — `filters` itself (search/
  // category/project/sort) stays the single source of truth either way, so
  // switching the toggle never resets a search/filter the user has typed.
  const effectiveParams: ACEListParams = grouped ? { ...filters, page: 1, pageSize: GROUPED_FETCH_SIZE } : filters;
  const { status, error, result, refetch } = useACEItems(effectiveParams);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as ACEListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  /**
   * Exports every ACE item matching the *current* search/category/project
   * filters — not just the 10 shown on this page — as a `.csv` (opens
   * directly in Excel/Google Sheets/Numbers, no import step; same
   * no-dependency approach as the public Cost Estimator's "Excel" download,
   * see `docs/OPEN_QUESTIONS.md` #77). `Rate` is exported as a bare number
   * (not the "₹X / UOM" display string) with `UOM` in its own column, so a
   * spreadsheet can actually treat it as a number — summing/averaging a
   * mixed-UOM column is still the exporter's own call to make, same
   * reasoning as why this table never sums Rate across categories itself.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const all = await aceAdapter.list({ ...filters, page: 1, pageSize: result?.total ?? 10000 });
      const projectName = (id: string) => allProjects.find((p) => p.id === id)?.name ?? "";
      const header = ["Sr. No.", "Item", "Notes", "Category", "Project", "UOM", "Rate (INR)"];
      const rows = all.items.map((item, idx) => [
        idx + 1,
        item.itemDescription,
        item.notes ?? "",
        CONTRACT_CATEGORY_CONFIG[item.category].label,
        projectName(item.projectId),
        ACE_UOM_CONFIG[item.uom].label,
        item.rate,
      ]);
      downloadCsv(`brickbasket-ace-rates-${new Date().toISOString().slice(0, 10)}`, [header, ...rows]);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Accepted Cost Estimate</h1>
          <p className="text-sm text-ink-muted">Predefined workable rates by work category, set per project before work starts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGrouped((g) => !g)}
            aria-pressed={grouped}
            title={grouped ? "Switch to a flat, single sortable list" : "Switch to grouped-by-category view"}
          >
            {grouped ? <LayoutGrid className="h-4 w-4" aria-hidden /> : <List className="h-4 w-4" aria-hidden />}
            {grouped ? "Grouped by category" : "Flat list"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || !result || result.total === 0}>
            <Download className="h-4 w-4" aria-hidden />
            {exporting ? "Exporting…" : "Export"}
          </Button>
          <PermissionGuard permission="ace:write">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add Rate
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <ACEFilters value={filters} onChange={handleFiltersChange} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load ACE items" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && (
        <EmptyState title="No ACE items match these filters" description="Try clearing a filter, or add a new rate." />
      )}

      {status === "success" && result && result.items.length > 0 && (
        <>
          <ACETable
            items={result.items}
            startIndex={(result.page - 1) * result.pageSize}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            groupByCategory={grouped}
            onView={
              canWrite
                ? (item) => {
                    setEditingItem(item);
                    setShowForm(true);
                  }
                : undefined
            }
          />
          {!grouped && (
            <Pagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          )}
        </>
      )}

      <Dialog
        open={showForm}
        onClose={closeForm}
        title={editingItem ? "Edit ACE Rate" : "Add ACE Rate"}
        description="Read-only for roles without the ace:write permission — this dialog only opens for those who hold it."
      >
        <ACEForm
          mode={editingItem ? "edit" : "create"}
          item={editingItem ?? undefined}
          onCancel={closeForm}
          onSuccess={() => {
            closeForm();
            refetch();
          }}
        />
      </Dialog>
    </div>
  );
}

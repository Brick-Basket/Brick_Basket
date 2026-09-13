"use client";

import { useState } from "react";
import { FileText, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useProjectContext } from "@/components/providers/project-provider";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentWarrantyMapping } from "@/components/documents/document-warranty-mapping";
import { DocumentPreviewPanel } from "@/components/documents/document-preview-panel";
import type { Document } from "@/types/domain/document";
import type { DocumentListParams } from "@/lib/api/adapters/documents-adapter";

type ViewMode = "list" | "warranty";

const PAGE_SIZE = 10;
const WARRANTY_PAGE_SIZE = 100;

export default function MyDocumentsPage() {
  return (
    <PermissionGuard
      permission="documents:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Documents" />
        </div>
      }
    >
      <MyDocumentsContent />
    </PermissionGuard>
  );
}

/**
 * Customer portal Documents screen. Read-only — no upload, no version
 * management, no visibility toggle (all admin-only, gated inside
 * DocumentPreviewPanel by `perspective`). Two scoping rules, both applied
 * client-side as a frontend safeguard only; the real backend's
 * customer-facing endpoint must enforce both server-side regardless:
 *   1. `visibleToCustomer: true` is always forced into the query.
 *   2. Scoped to the project currently selected in the global project
 *      selector (ProjectContext) — the first module screen to read the
 *      "current project" the selector already exposes. If the signed-in
 *      customer has no project selected yet (e.g. no projects at all),
 *      an empty state is shown instead of querying with `projectId`
 *      unset, which would otherwise leak documents from every project.
 */
function MyDocumentsContent() {
  const { projects, selected } = useProjectContext();
  const [view, setView] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<DocumentListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "uploadedAt",
    sortDir: "desc",
  });
  const [previewId, setPreviewId] = useState<string | null>(null);

  const baseParams: DocumentListParams = {
    ...filters,
    visibleToCustomer: true,
    projectId: selected?.id,
  };
  const listParams: DocumentListParams =
    view === "list" ? baseParams : { ...baseParams, page: 1, pageSize: WARRANTY_PAGE_SIZE, warrantyOnly: true };

  const { status, error, result, refetch } = useDocuments(listParams);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as DocumentListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  if (projects.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          icon={FileText}
          title="No project yet"
          description="Once a project is set up for you, drawings and documents shared for it will appear here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Documents</h1>
          <p className="text-sm text-ink-muted">
            Drawings, layouts, certificates, and warranty documents shared for {selected?.name ?? "your project"}.
          </p>
        </div>
        <div className="flex rounded-md border border-border p-0.5">
          <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" onClick={() => setView("list")} aria-pressed={view === "list"}>
            <TableIcon className="h-4 w-4" aria-hidden />
            All Documents
          </Button>
          <Button
            variant={view === "warranty" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("warranty")}
            aria-pressed={view === "warranty"}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Warranty Mapping
          </Button>
        </div>
      </div>

      <DocumentFilters value={filters} onChange={setFilters} showProjectFilter={false} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load documents" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && view === "list" && (
        <EmptyState
          icon={FileText}
          title="No documents match these filters"
          description="Documents BrickBasket shares for this project will appear here."
        />
      )}

      {status === "success" && result && result.items.length > 0 && view === "list" && (
        <>
          <DocumentTable
            documents={result.items}
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onSortChange={handleSortChange}
            onView={(doc: Document) => setPreviewId(doc.id)}
          />
          <Pagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}

      {status === "success" && result && view === "warranty" && (
        <DocumentWarrantyMapping documents={result.items} onView={(doc) => setPreviewId(doc.id)} />
      )}

      <DocumentPreviewPanel documentId={previewId} perspective="customer" onClose={() => setPreviewId(null)} />
    </div>
  );
}

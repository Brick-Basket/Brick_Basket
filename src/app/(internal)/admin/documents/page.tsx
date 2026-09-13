"use client";

import { useState } from "react";
import { LayoutGrid, Plus, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentWarrantyMapping } from "@/components/documents/document-warranty-mapping";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentPreviewPanel } from "@/components/documents/document-preview-panel";
import type { Document } from "@/types/domain/document";
import type { DocumentListParams } from "@/lib/api/adapters/documents-adapter";

type ViewMode = "list" | "warranty";

const PAGE_SIZE = 10;
const WARRANTY_PAGE_SIZE = 100;

export default function AdminDocumentsPage() {
  return (
    <PermissionGuard
      permission="documents:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Document Management" />
        </div>
      }
    >
      <AdminDocumentsContent />
    </PermissionGuard>
  );
}

function AdminDocumentsContent() {
  const [view, setView] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<DocumentListParams>({
    page: 1,
    pageSize: PAGE_SIZE,
    sortBy: "uploadedAt",
    sortDir: "desc",
  });
  const [showUpload, setShowUpload] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const listParams: DocumentListParams =
    view === "list" ? filters : { ...filters, page: 1, pageSize: WARRANTY_PAGE_SIZE, warrantyOnly: true };
  const { status, error, result, refetch } = useDocuments(listParams);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as DocumentListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Drawing & Document Management</h1>
          <p className="text-sm text-ink-muted">Finalized drawings, layouts, certificates, and warranty documents by project.</p>
        </div>
        <div className="flex items-center gap-2">
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
          <PermissionGuard permission="documents:write">
            <Button onClick={() => setShowUpload(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Upload Document
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <DocumentFilters value={filters} onChange={setFilters} />

      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-10 w-full" />
          <LoadingSkeleton className="h-64 w-full" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load documents" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && result && result.items.length === 0 && view === "list" && (
        <EmptyState title="No documents match these filters" description="Try clearing a filter, or upload a new document." />
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

      <Dialog open={showUpload} onClose={() => setShowUpload(false)} title="Upload Document" description="Metadata is required; the file itself is optional for this demo.">
        <DocumentUploadForm
          onCancel={() => setShowUpload(false)}
          onSuccess={() => {
            setShowUpload(false);
            refetch();
          }}
        />
      </Dialog>

      <DocumentPreviewPanel documentId={previewId} perspective="admin" onClose={() => setPreviewId(null)} />
    </div>
  );
}

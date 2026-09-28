"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, LayoutGrid, Plus, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/domain/empty-state";
import { ErrorState } from "@/components/domain/error-state";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { Pagination } from "@/components/domain/pagination";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useContract } from "@/hooks/use-contracts";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentFilters } from "@/components/documents/document-filters";
import { DocumentTable } from "@/components/documents/document-table";
import { DocumentWarrantyMapping } from "@/components/documents/document-warranty-mapping";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentPreviewPanel } from "@/components/documents/document-preview-panel";
import { CONTRACT_CATEGORY_TYPE_CONFIG } from "@/components/contracts/contract-category-type-config";
import { ADMIN_ROUTES } from "@/lib/constants/routes";
import type { Document } from "@/types/domain/document";
import type { DocumentListParams } from "@/lib/api/adapters/documents-adapter";

type ViewMode = "list" | "warranty";

const PAGE_SIZE = 10;
const WARRANTY_PAGE_SIZE = 100;

/**
 * Documents for one contract — owner corrections #2/#3/#6: this is where
 * "the filter page ... to filter warranty documents & other documents
 * separately" (the All Documents / Warranty Mapping toggle, carried over
 * from the old top-level page) now lives, and it's the *only* place
 * uploading happens, always routed through this specific contract.
 */
export default function AdminContractDocumentsPage() {
  return (
    <PermissionGuard
      permission="documents:read"
      fallback={
        <div className="p-6 md:p-8">
          <ErrorState variant="forbidden" title="You don't have access to Document Management" />
        </div>
      }
    >
      <AdminContractDocumentsContent />
    </PermissionGuard>
  );
}

function AdminContractDocumentsContent() {
  const router = useRouter();
  const params = useParams<{ contractId: string }>();
  const contractId = params.contractId;
  const { status: contractStatus, contract, error: contractError, refetch: refetchContract } = useContract(contractId);

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
    view === "list"
      ? { ...filters, contractId }
      : { ...filters, contractId, page: 1, pageSize: WARRANTY_PAGE_SIZE, warrantyOnly: true };
  const { status, error, result, refetch } = useDocuments(listParams);

  const handleSortChange = (key: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: key as DocumentListParams["sortBy"],
      sortDir: prev.sortBy === key && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  };

  if (contractStatus === "loading") {
    return (
      <div className="flex flex-col gap-4 p-6 md:p-8">
        <LoadingSkeleton className="h-6 w-1/2" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (contractStatus === "error" || !contract) {
    return (
      <div className="p-6 md:p-8">
        <ErrorState title="Could not load this contract" description={contractError ?? undefined} onRetry={refetchContract} />
      </div>
    );
  }

  const contractsById = new Map([[contract.id, contract]]);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push(ADMIN_ROUTES.documents)}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to Contracts
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">{contract.contractNumber}</h1>
          <p className="text-sm text-ink-muted">
            {contract.title} · {contract.city}
            {contract.state ? `, ${contract.state}` : ""} · {CONTRACT_CATEGORY_TYPE_CONFIG[contract.contractCategory].label}
          </p>
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
        <EmptyState title="No documents match these filters" description="Try clearing a filter, or upload a new document for this contract." />
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
        <DocumentWarrantyMapping documents={result.items} contractsById={contractsById} onView={(doc) => setPreviewId(doc.id)} />
      )}

      <Dialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Document"
        description="Metadata is required; the file itself is optional for this demo."
      >
        <DocumentUploadForm
          contract={contract}
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

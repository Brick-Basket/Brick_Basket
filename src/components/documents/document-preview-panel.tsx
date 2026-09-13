"use client";

import { useState } from "react";
import { Download, FileQuestion, Upload } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSkeleton } from "@/components/domain/loading-skeleton";
import { ErrorState } from "@/components/domain/error-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useDocument, useUpdateDocument } from "@/hooks/use-documents";
import { documentsAdapter } from "@/lib/api/adapters/documents-adapter";
import { DocumentVersionHistory } from "@/components/documents/document-version-history";
import { DocumentVersionUploadForm } from "@/components/documents/document-version-upload-form";
import { DOCUMENT_CATEGORY_CONFIG } from "@/components/documents/document-category-config";
import { formatBytes, formatDateTime } from "@/lib/utils/format";
import { useProjects } from "@/hooks/use-projects";

/**
 * Preview modal boundary required by the module. Deliberately does NOT
 * commit to a PDF/image rendering library — images use a plain `<img>`,
 * PDFs use the browser's own native viewer via an `<iframe>` (every modern
 * browser embeds one), and anything else falls back to a "no preview"
 * state. Only documents with an in-memory object URL (uploaded this
 * session — see `DocumentsAdapter.getPreviewUrl`) have anything to
 * actually preview or download; every seeded demo record shows a clearly
 * labeled "no file on record" state instead of a broken preview.
 */
export function DocumentPreviewPanel({
  documentId,
  perspective,
  onClose,
}: {
  documentId: string | null;
  perspective: "admin" | "customer";
  onClose: () => void;
}) {
  const { session } = useSession();
  const { status, error, document, versions, refetch } = useDocument(documentId);
  const { submit: updateDocument, status: updateStatus, error: updateError } = useUpdateDocument();
  const { projects: allProjects } = useProjects();
  const [showVersionUpload, setShowVersionUpload] = useState(false);

  const previewUrl = documentId ? documentsAdapter.getPreviewUrl(documentId) : null;
  const project = document ? allProjects.find((p) => p.id === document.projectId) : null;

  // FRONTEND IMPLEMENTATION DECISION (post-Part-20 stabilization pass, Phase
  // 13): guarded on the mutation's return value — a failed toggle used to
  // refetch unconditionally (silently reverting the checkbox with no
  // explanation); now only refetches on success, and `updateError` is
  // shown next to the control. See docs/OPEN_QUESTIONS.md #45.
  const handleToggleVisibility = async () => {
    if (!document || !session) return;
    const updated = await updateDocument(document.id, { visibleToCustomer: !document.visibleToCustomer }, {
      id: session.user.id,
      name: session.user.name,
    });
    if (updated) refetch();
  };

  return (
    <Sheet
      open={!!documentId}
      onClose={onClose}
      title={document?.title ?? "Document"}
      description={document ? DOCUMENT_CATEGORY_CONFIG[document.category].label : undefined}
      widthClassName="max-w-2xl"
    >
      {status === "loading" && (
        <div className="flex flex-col gap-3">
          <LoadingSkeleton className="h-48 w-full" />
          <LoadingSkeleton className="h-4 w-2/3" />
        </div>
      )}

      {status === "error" && <ErrorState title="Could not load this document" description={error ?? undefined} onRetry={refetch} />}

      {status === "success" && document && (
        <div className="flex flex-col gap-6">
          <DocumentPreviewArea fileType={document.fileType} previewUrl={previewUrl} title={document.title} />

          <div className="flex flex-wrap gap-2">
            {previewUrl ? (
              <a href={previewUrl} download={document.fileName} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Download className="h-4 w-4" aria-hidden />
                Download
              </a>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4" aria-hidden />
                Download
              </Button>
            )}
            {perspective === "admin" && (
              <PermissionGuard permission="documents:write">
                <Button variant="outline" size="sm" onClick={() => setShowVersionUpload((v) => !v)}>
                  <Upload className="h-4 w-4" aria-hidden />
                  Upload New Version
                </Button>
              </PermissionGuard>
            )}
          </div>

          {!previewUrl && (
            <p className="flex items-center gap-2 text-xs text-ink-muted">
              <FileQuestion className="h-3.5 w-3.5 shrink-0" aria-hidden />
              No file on record for this demo document — Preview and Download need a file uploaded during this
              session. See docs/OPEN_QUESTIONS.md #8.
            </p>
          )}

          {perspective === "admin" && showVersionUpload && (
            <DocumentVersionUploadForm
              document={document}
              onCancel={() => setShowVersionUpload(false)}
              onSuccess={() => {
                setShowVersionUpload(false);
                refetch();
              }}
            />
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-ink-muted">Project</dt>
              <dd className="text-ink">{project?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Version</dt>
              <dd className="text-ink">v{document.version}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">File</dt>
              <dd className="text-ink">
                {document.fileName} ({formatBytes(document.fileSizeBytes)})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Uploaded</dt>
              <dd className="text-ink">
                {formatDateTime(document.uploadedAt)} · {document.uploadedByName}
              </dd>
            </div>
            {document.warrantyItem && (
              <div className="col-span-2">
                <dt className="text-xs text-ink-muted">Warranted Item</dt>
                <dd className="text-ink">{document.warrantyItem}</dd>
              </div>
            )}
            {document.warrantyExpiresAt && (
              <div className="col-span-2">
                <dt className="text-xs text-ink-muted">Warranty Expires</dt>
                <dd className="text-ink">{formatDateTime(document.warrantyExpiresAt)}</dd>
              </div>
            )}
          </dl>

          {perspective === "admin" && (
            <PermissionGuard permission="documents:write">
              <label className="flex items-center gap-2 text-sm text-ink">
                <Checkbox
                  checked={document.visibleToCustomer}
                  onChange={handleToggleVisibility}
                  disabled={updateStatus === "loading"}
                />
                Visible to customer
              </label>
              {updateError && <p className="mt-1 text-xs text-error">{updateError}</p>}
            </PermissionGuard>
          )}

          <div className="border-t border-border pt-4">
            <h3 className="mb-3 font-heading text-sm font-semibold text-ink">Version History</h3>
            <DocumentVersionHistory versions={versions} />
          </div>
        </div>
      )}
    </Sheet>
  );
}

function DocumentPreviewArea({
  fileType,
  previewUrl,
  title,
}: {
  fileType: string;
  previewUrl: string | null;
  title: string;
}) {
  if (!previewUrl) {
    return (
      <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border bg-surface-muted text-sm text-ink-muted">
        No preview available
      </div>
    );
  }
  if (fileType.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={previewUrl} alt={title} className="max-h-96 w-full rounded-card border border-border object-contain" />;
  }
  if (fileType === "application/pdf") {
    return (
      <iframe src={previewUrl} title={title} className="h-96 w-full rounded-card border border-border" />
    );
  }
  return (
    <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border bg-surface-muted text-sm text-ink-muted">
      Preview not available for this file type — use Download instead.
    </div>
  );
}

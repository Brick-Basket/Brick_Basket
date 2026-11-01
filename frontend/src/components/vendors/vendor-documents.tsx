"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, FileText, Loader2, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/domain/empty-state";
import { PermissionGuard } from "@/components/shell/permission-guard";
import { useSession } from "@/components/providers/auth-provider";
import { useAddVendorDocument } from "@/hooks/use-vendors";
import { VENDOR_DOCUMENT_TYPE_CONFIG, VENDOR_DOCUMENT_TYPE_ORDER } from "@/components/vendors/vendor-config";
import { formatDate } from "@/lib/utils/format";
import type { VendorDocument } from "@/types/domain/vendor";

const documentFormSchema = z.object({
  documentType: z.enum(["pan_card", "gstin_certificate", "msme_udyam_certificate", "other"]),
  label: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

/**
 * Document 2 correction: "option to attach vendor documents (PAN card,
 * GSTIN certificate, MSME/UDYAM certificate, or other), selecting the
 * type of document first." Mirrors `DocumentUploadForm`'s
 * metadata-only / file-optional pattern — see
 * `VendorsAdapter.addDocument`/`getDocumentPreviewUrl` and
 * `src/types/domain/vendor.ts`'s header comment on `VendorDocument`.
 */
export function VendorDocuments({
  vendorId,
  documents,
  onAdded,
}: {
  vendorId: string;
  documents: VendorDocument[];
  onAdded: () => void;
}) {
  const { session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { submit: addDocument, status, error } = useAddVendorDocument();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: { documentType: "pan_card", label: "" },
  });

  const documentType = watch("documentType");

  const onSubmit = async (values: DocumentFormValues) => {
    if (!session) return;
    const defaultLabel = VENDOR_DOCUMENT_TYPE_CONFIG[values.documentType].label;
    const created = await addDocument(
      vendorId,
      {
        documentType: values.documentType,
        label: values.label || undefined,
        fileName: file?.name ?? `${defaultLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        fileType: file?.type || "application/pdf",
        fileSizeBytes: file?.size ?? 0,
      },
      file,
      { id: session.user.id, name: session.user.name },
    );
    if (created) {
      reset();
      setFile(null);
      setShowForm(false);
      onAdded();
    }
  };

  const submitting = isSubmitting || status === "loading";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-ink">Documents</p>
        <PermissionGuard permission="vendors:write">
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden />
            Attach Document
          </Button>
        </PermissionGuard>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-card border border-border bg-surface-muted p-4" noValidate>
          <FormField label="Type of Document" htmlFor="vendor-doc-type" required>
            <Select id="vendor-doc-type" {...register("documentType")}>
              {VENDOR_DOCUMENT_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {VENDOR_DOCUMENT_TYPE_CONFIG[t].label}
                </option>
              ))}
            </Select>
          </FormField>

          {documentType === "other" && (
            <FormField label="Label" htmlFor="vendor-doc-label" hint="Describe this document.">
              <Input id="vendor-doc-label" {...register("label")} />
            </FormField>
          )}

          <div>
            <Label htmlFor="vendor-doc-file">File (optional)</Label>
            <div className="mt-1.5">
              <Input id="vendor-doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="h-auto py-2" />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              No backend file storage yet — attaching here only keeps the file in this browser tab for this session.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
              Attach
            </Button>
          </div>
        </form>
      )}

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="No documents attached" description="PAN card, GSTIN certificate, and other vendor documents will appear here." />
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface p-3 text-sm">
              <div>
                <p className="text-ink">{doc.label || VENDOR_DOCUMENT_TYPE_CONFIG[doc.documentType].label}</p>
                <p className="text-xs text-ink-muted">
                  {doc.fileName} · Uploaded {formatDate(doc.uploadedAt)} by {doc.uploadedByName}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

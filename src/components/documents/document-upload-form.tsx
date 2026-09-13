"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateDocument } from "@/hooks/use-documents";
import { useProjects } from "@/hooks/use-projects";
import { DOCUMENT_CATEGORY_CONFIG, DOCUMENT_CATEGORY_ORDER } from "@/components/documents/document-category-config";
import type { Document, DocumentCategory } from "@/types/domain/document";

const uploadSchema = z.object({
  title: z.string().min(3, "Add a title"),
  category: z.enum(["finalized_drawing", "layout_2d", "layout_3d", "material_test_certificate", "warranty_tax_invoice", "warranted_goods_certificate"]),
  projectId: z.string().min(1, "Select a project"),
  visibleToCustomer: z.boolean(),
  warrantyItem: z.string().optional(),
  warrantyExpiresAt: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const WARRANTY_CATEGORIES: DocumentCategory[] = ["warranty_tax_invoice", "warranted_goods_certificate"];

/**
 * Upload UI for the admin Drawing & Document Management module. Accepts a
 * real file via the browser File API — since there's no backend/storage
 * yet (see docs/OPEN_QUESTIONS.md #8), the file's bytes are kept only as an
 * in-memory object URL for this session (`DocumentsAdapter.getPreviewUrl`),
 * not persisted, so Preview/Download work for what you just uploaded but
 * not after a reload. Choosing a file is optional — metadata-only demo
 * records are also allowed, matching every seeded document.
 */
export function DocumentUploadForm({
  onSuccess,
  onCancel,
  defaultProjectId,
}: {
  onSuccess: (document: Document) => void;
  onCancel: () => void;
  defaultProjectId?: string;
}) {
  const { session } = useSession();
  const { submit, status, error } = useCreateDocument();
  const { projects: allProjects } = useProjects();
  const [file, setFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
      category: "finalized_drawing",
      projectId: defaultProjectId ?? "",
      visibleToCustomer: false,
      warrantyItem: "",
      warrantyExpiresAt: "",
    },
  });

  const category = watch("category");
  const isWarrantyCategory = WARRANTY_CATEGORIES.includes(category);

  const onSubmit = async (values: UploadFormValues) => {
    if (!session) return;
    const created = await submit(
      {
        title: values.title,
        category: values.category,
        projectId: values.projectId,
        fileName: file?.name ?? `${values.title.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        fileType: file?.type || "application/pdf",
        fileSizeBytes: file?.size ?? 0,
        visibleToCustomer: values.visibleToCustomer,
        warrantyItem: isWarrantyCategory ? values.warrantyItem : undefined,
        warrantyExpiresAt: isWarrantyCategory ? values.warrantyExpiresAt : undefined,
      },
      file,
      { id: session.user.id, name: session.user.name },
    );
    if (created) onSuccess(created);
  };

  const submitting = isSubmitting || status === "loading";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <FormField label="Title" htmlFor="doc-title" required error={errors.title?.message}>
        <Input id="doc-title" invalid={!!errors.title} {...register("title")} />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Category" htmlFor="doc-category" required error={errors.category?.message}>
          <Select id="doc-category" {...register("category")}>
            {DOCUMENT_CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {DOCUMENT_CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Project" htmlFor="doc-project" required error={errors.projectId?.message}>
          <Select id="doc-project" invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      {isWarrantyCategory && (
        <div className="grid gap-4 rounded-card border border-border p-3 sm:grid-cols-2">
          <FormField label="Warranted Item" htmlFor="doc-warranty-item" hint="What this warranty covers.">
            <Input id="doc-warranty-item" {...register("warrantyItem")} />
          </FormField>
          <FormField label="Warranty Expires" htmlFor="doc-warranty-expires">
            <Input id="doc-warranty-expires" type="date" {...register("warrantyExpiresAt")} />
          </FormField>
        </div>
      )}

      <div>
        <Label htmlFor="doc-file">File (optional)</Label>
        <div className="mt-1.5 flex items-center gap-3">
          <Input
            id="doc-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="h-auto py-2"
          />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Allowed file types and size limits are TBD — see docs/OPEN_QUESTIONS.md #8. Uploading here only keeps the
          file in this browser tab for preview/download during this session.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <Checkbox {...register("visibleToCustomer")} />
        Visible to customer
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
          Upload
        </Button>
      </div>
    </form>
  );
}

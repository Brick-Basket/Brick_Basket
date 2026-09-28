"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/providers/auth-provider";
import { useCreateSiteUpdate } from "@/hooks/use-site-updates";
import { useProjects } from "@/hooks/use-projects";
import { formatBytes } from "@/lib/utils/format";
import type { SiteUpdate } from "@/types/domain/site-update";

const uploadSchema = z.object({
  projectId: z.string().min(1, "Select a project"),
  updateDate: z.string().min(1, "Select a date"),
  remarks: z.string().min(5, "Add a short remark describing this update"),
  relatedWorkItem: z.string().optional(),
  visibleToCustomer: z.boolean(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// FRONTEND IMPLEMENTATION DECISION — proposed size/type/duration limits, not
// owner or backend confirmed. See docs/OPEN_QUESTIONS.md #69 and
// docs/FILE_UPLOADS.md's "Site Updates media" section for the full
// reasoning and the proposed real-backend upload architecture (presigned
// direct-to-storage upload, async transcode/resize, CDN delivery) these
// numbers are meant to anchor. Enforced here only as a client-side
// guardrail against this mock's in-memory object-URL storage — a real
// backend must independently re-validate every one of these server-side,
// the same "UX-layer defense only" caveat that applies to permissions.
const MAX_PHOTO_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
const MAX_VIDEO_DURATION_SECONDS = 3 * 60; // 3 minutes
const MAX_FILES_PER_UPDATE = 10;
const MAX_TOTAL_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "heic", "heif", "webp"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "m4v", "qt"];

function getMediaKind(file: File): "photo" | "video" | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type.startsWith("image/") || PHOTO_EXTENSIONS.includes(ext)) return "photo";
  if (file.type.startsWith("video/") || VIDEO_EXTENSIONS.includes(ext)) return "video";
  return null;
}

/** Reads a video file's duration via a throwaway <video> element. Resolves 0 (never blocks) if the browser can't read it. */
function getVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(videoEl.duration || 0);
    };
    videoEl.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    videoEl.src = url;
  });
}

/**
 * "Post Update" form for the Site Updates module — the daily photo/video
 * upload feature. Posted by a site engineer, project manager, or admin (see
 * `ROLE_PERMISSIONS["site_updates:write"]`). Accepts multiple real files via
 * the browser File API (`accept="image/*,video/*" multiple`); each becomes
 * one `SiteUpdateMedia` entry, matched by upload order. As with Document
 * Management, there's no backend/storage yet, so files are kept only as
 * in-memory object URLs for this browser session — see
 * `SiteUpdatesAdapter.getPreviewUrl` and docs/FILE_UPLOADS.md. Choosing
 * files is optional (a remarks-only update is still valid — e.g. a written
 * status note), but at least a remark is always required, since a bare
 * photo with zero context isn't useful to a customer.
 *
 * `visibleToCustomer` defaults to checked — unlike Document Management,
 * where it defaults unchecked. Surfacing progress to the customer is this
 * module's entire purpose; a staff member unchecks it only for an internal
 * working note not yet ready to share (see the seeded example in
 * `data/mock/site-updates.ts`). See docs/OPEN_QUESTIONS.md.
 */
export function SiteUpdateUploadForm({
  onSuccess,
  onCancel,
  defaultProjectId,
}: {
  onSuccess: (update: SiteUpdate) => void;
  onCancel: () => void;
  defaultProjectId?: string;
}) {
  const { session } = useSession();
  const { submit, status, error } = useCreateSiteUpdate();
  const { projects: allProjects } = useProjects();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      projectId: defaultProjectId ?? "",
      updateDate: todayIso(),
      remarks: "",
      relatedWorkItem: "",
      visibleToCustomer: true,
    },
  });

  const handleFilesChange = async (fileList: FileList | null) => {
    setFileError(null);

    if (!fileList || fileList.length === 0) {
      setFiles([]);
      return;
    }

    const incoming = Array.from(fileList);

    if (incoming.length > MAX_FILES_PER_UPDATE) {
      setFileError(`Select at most ${MAX_FILES_PER_UPDATE} files per update.`);
      setFiles([]);
      return;
    }

    const accepted: File[] = [];
    const rejections: string[] = [];

    for (const file of incoming) {
      const kind = getMediaKind(file);
      if (!kind) {
        rejections.push(`${file.name}: unsupported file type — only photos (JPG, PNG, HEIC, WEBP) and videos (MP4, MOV) are accepted.`);
        continue;
      }

      const sizeLimit = kind === "photo" ? MAX_PHOTO_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
      if (file.size > sizeLimit) {
        rejections.push(`${file.name}: over the ${formatBytes(sizeLimit)} limit for a ${kind} (${formatBytes(file.size)}).`);
        continue;
      }

      if (kind === "video") {
        const durationSeconds = await getVideoDurationSeconds(file);
        if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
          rejections.push(`${file.name}: longer than the ${MAX_VIDEO_DURATION_SECONDS / 60}-minute limit for a video clip.`);
          continue;
        }
      }

      accepted.push(file);
    }

    const totalBytes = accepted.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_SIZE_BYTES) {
      setFileError(
        `These files total ${formatBytes(totalBytes)}, over the ${formatBytes(MAX_TOTAL_SIZE_BYTES)} limit per update. Remove some files, or post a second update for the rest.`,
      );
      setFiles([]);
      return;
    }

    setFiles(accepted);
    if (rejections.length > 0) setFileError(rejections.join(" "));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const onSubmit = async (values: UploadFormValues) => {
    if (!session) return;
    const mediaMeta = files.map((file) => ({
      type: (file.type.startsWith("video/") ? "video" : "photo") as "photo" | "video",
    }));
    const created = await submit(
      {
        projectId: values.projectId,
        updateDate: values.updateDate,
        remarks: values.remarks,
        relatedWorkItem: values.relatedWorkItem || undefined,
        visibleToCustomer: values.visibleToCustomer,
      },
      files,
      mediaMeta,
      { id: session.user.id, name: session.user.name },
    );
    if (created) onSuccess(created);
  };

  const submitting = isSubmitting || status === "loading";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Project" htmlFor="supd-project" required error={errors.projectId?.message}>
          <Select id="supd-project" invalid={!!errors.projectId} {...register("projectId")}>
            <option value="">Select a project…</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Date" htmlFor="supd-date" required error={errors.updateDate?.message}>
          <Input id="supd-date" type="date" invalid={!!errors.updateDate} {...register("updateDate")} />
        </FormField>
      </div>

      <FormField label="Remarks" htmlFor="supd-remarks" required error={errors.remarks?.message} hint="A short plain-language note the customer will read alongside the photos/videos.">
        <Textarea id="supd-remarks" invalid={!!errors.remarks} rows={3} {...register("remarks")} />
      </FormField>

      <FormField label="Related Work Item (optional)" htmlFor="supd-work-item" hint='E.g. "Foundation & Plinth" or "MEP — Electrical First Fix".'>
        <Input id="supd-work-item" {...register("relatedWorkItem")} />
      </FormField>

      <div>
        <Label htmlFor="supd-files">Photos / Videos</Label>
        <div className="mt-1.5">
          <Input
            id="supd-files"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => {
              void handleFilesChange(e.target.files);
            }}
            className="h-auto py-2"
          />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Up to {MAX_FILES_PER_UPDATE} files per update ({formatBytes(MAX_TOTAL_SIZE_BYTES)} combined) — photos up to{" "}
          {formatBytes(MAX_PHOTO_SIZE_BYTES)}, videos up to {formatBytes(MAX_VIDEO_SIZE_BYTES)} and{" "}
          {MAX_VIDEO_DURATION_SECONDS / 60} minutes. These are proposed limits pending backend confirmation — see
          docs/OPEN_QUESTIONS.md #69. Uploading here only keeps the files in this browser tab for preview during this
          session.
        </p>

        {fileError && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-error">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {fileError}
          </p>
        )}

        {files.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface-muted px-2.5 py-1.5 text-xs text-ink"
              >
                <span className="truncate">
                  {file.name} <span className="text-ink-muted">({formatBytes(file.size)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label={`Remove ${file.name}`}
                  className="shrink-0 text-ink-muted hover:text-error"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
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
          Post Update
        </Button>
      </div>
    </form>
  );
}

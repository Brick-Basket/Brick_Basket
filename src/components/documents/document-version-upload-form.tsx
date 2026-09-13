"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSession } from "@/components/providers/auth-provider";
import { useUploadDocumentVersion } from "@/hooks/use-documents";
import type { Document } from "@/types/domain/document";

/** Compact "upload a new version" form embedded in the document preview panel. */
export function DocumentVersionUploadForm({
  document,
  onSuccess,
  onCancel,
}: {
  document: Document;
  onSuccess: (document: Document) => void;
  onCancel: () => void;
}) {
  const { session } = useSession();
  const { submit, status, error } = useUploadDocumentVersion();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!session) return;
    const updated = await submit(
      document.id,
      {
        fileName: file?.name ?? document.fileName,
        fileType: file?.type || document.fileType,
        fileSizeBytes: file?.size ?? document.fileSizeBytes,
        note: note.trim() || undefined,
      },
      file,
      { id: session.user.id, name: session.user.name },
    );
    if (updated) onSuccess(updated);
  };

  const submitting = status === "loading";

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border p-3">
      <div>
        <Label htmlFor="doc-version-file">New file (optional)</Label>
        <Input
          id="doc-version-file"
          type="file"
          className="mt-1.5 h-auto py-2"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div>
        <Label htmlFor="doc-version-note">Note (optional)</Label>
        <Textarea
          id="doc-version-note"
          className="mt-1.5"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What changed in this version…"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
          Upload as v{document.version + 1}
        </Button>
      </div>
    </div>
  );
}

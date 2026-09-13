"use client";

import { useCallback, useEffect, useState } from "react";
import {
  documentsAdapter,
  type DocumentActor,
  type DocumentListParams,
  type DocumentListResult,
} from "@/lib/api/adapters/documents-adapter";
import type { CreateDocumentInput, Document, DocumentVersion, UpdateDocumentInput, UploadNewVersionInput } from "@/types/domain/document";

type Status = "idle" | "loading" | "success" | "error";

/** Lists documents for `/admin/documents` and `/dashboard/documents` (the latter always passes `visibleToCustomer: true` + its own `projectId`). */
export function useDocuments(params: DocumentListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    documentsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load documents. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-document detail + its version history, for the preview/detail panel. */
export function useDocument(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setDocument(null);
      setVersions([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([documentsAdapter.get(id), documentsAdapter.listVersions(id)])
      .then(([foundDocument, foundVersions]) => {
        if (cancelled) return;
        setDocument(foundDocument);
        setVersions(foundVersions);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this document. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, document, versions, refetch };
}

function useMutation<Args extends unknown[], Result>(fn: (...args: Args) => Promise<Result>) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (...args: Args) => {
      setStatus("loading");
      setError(null);
      try {
        const result = await fn(...args);
        setStatus("success");
        return result;
      } catch (e) {
        setStatus("error");
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
        return null;
      }
    },
    // fn is a stable module-level adapter method reference in every caller below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { submit, status, error };
}

export function useCreateDocument() {
  return useMutation((input: CreateDocumentInput, file: File | null, actor: DocumentActor) =>
    documentsAdapter.create(input, file, actor),
  );
}

export function useUpdateDocument() {
  return useMutation((id: string, patch: UpdateDocumentInput, actor: DocumentActor) =>
    documentsAdapter.update(id, patch, actor),
  );
}

export function useUploadDocumentVersion() {
  return useMutation((id: string, input: UploadNewVersionInput, file: File | null, actor: DocumentActor) =>
    documentsAdapter.uploadNewVersion(id, input, file, actor),
  );
}

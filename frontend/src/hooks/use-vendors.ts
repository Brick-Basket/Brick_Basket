"use client";

import { useCallback, useEffect, useState } from "react";
import {
  vendorsAdapter,
  type VendorActor,
  type VendorListParams,
  type VendorListResult,
} from "@/lib/api/adapters/vendors-adapter";
import type {
  CreateVendorAssessmentInput,
  CreateVendorDocumentInput,
  CreateVendorInput,
  CreateVendorPastWorkInput,
  UpdateVendorInput,
  Vendor,
  VendorAssessment,
  VendorDocument,
  VendorPastWorkEntry,
} from "@/types/domain/vendor";

type Status = "idle" | "loading" | "success" | "error";

/** Lists vendors for `/admin/vendors`. */
export function useVendors(params: VendorListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VendorListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    vendorsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load vendors. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-vendor detail + its assessment, past-work, and document history, for the detail page. */
export function useVendor(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [assessments, setAssessments] = useState<VendorAssessment[]>([]);
  const [pastWork, setPastWork] = useState<VendorPastWorkEntry[]>([]);
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setVendor(null);
      setAssessments([]);
      setPastWork([]);
      setDocuments([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([
      vendorsAdapter.get(id),
      vendorsAdapter.listAssessments(id),
      vendorsAdapter.listPastWork(id),
      vendorsAdapter.listDocuments(id),
    ])
      .then(([foundVendor, foundAssessments, foundPastWork, foundDocuments]) => {
        if (cancelled) return;
        setVendor(foundVendor);
        setAssessments(foundAssessments);
        setPastWork(foundPastWork);
        setDocuments(foundDocuments);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this vendor. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, vendor, assessments, pastWork, documents, refetch };
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

export function useCreateVendor() {
  return useMutation((input: CreateVendorInput, actor: VendorActor) => vendorsAdapter.create(input, actor));
}

export function useUpdateVendor() {
  return useMutation((id: string, patch: UpdateVendorInput, actor: VendorActor) => vendorsAdapter.update(id, patch, actor));
}

export function useAddVendorAssessment() {
  return useMutation((vendorId: string, input: CreateVendorAssessmentInput, actor: VendorActor) =>
    vendorsAdapter.addAssessment(vendorId, input, actor),
  );
}

export function useAddVendorPastWork() {
  return useMutation((vendorId: string, input: CreateVendorPastWorkInput, actor: VendorActor) =>
    vendorsAdapter.addPastWork(vendorId, input, actor),
  );
}

/** Document 2 correction — attach a vendor document (PAN card, GSTIN certificate, MSME/UDYAM certificate, or other). */
export function useAddVendorDocument() {
  return useMutation((vendorId: string, input: CreateVendorDocumentInput, file: File | null, actor: VendorActor) =>
    vendorsAdapter.addDocument(vendorId, input, file, actor),
  );
}

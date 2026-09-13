"use client";

import { useCallback, useState } from "react";
import { leadsAdapter } from "@/lib/api/adapters/leads-adapter";
import type { CreateLeadInput, Lead } from "@/types/domain/lead";

type Status = "idle" | "loading" | "success" | "error";

/**
 * React Query-shaped today, swappable for a real `useMutation` later without
 * changing any component that calls this hook — only this file's internals
 * would change.
 */
export function useCreateLead() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);

  const submit = useCallback(async (input: CreateLeadInput) => {
    setStatus("loading");
    setError(null);
    try {
      const created = await leadsAdapter.create(input);
      setLead(created);
      setStatus("success");
      return created;
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setLead(null);
  }, []);

  return { submit, status, error, lead, reset };
}

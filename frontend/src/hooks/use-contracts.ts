"use client";

import { useCallback, useEffect, useState } from "react";
import {
  contractsAdapter,
  type ContractActor,
  type ContractListParams,
  type ContractListResult,
} from "@/lib/api/adapters/contracts-adapter";
import type { Contract, CreateContractInput, UpdateContractInput } from "@/types/domain/contract";
import type { ContractAuditEntry } from "@/types/domain/contract-audit";

type Status = "idle" | "loading" | "success" | "error";

/** Lists contracts for `/admin/contracts` and `/dashboard/contracts` (the latter always passes a fixed `customerId`). */
export function useContracts(params: ContractListParams) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContractListResult | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    contractsAdapter
      .list(JSON.parse(paramsKey))
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load contracts. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, result, refetch };
}

/** Single-contract detail + its acceptance/audit history, for the detail page. */
export function useContract(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [audit, setAudit] = useState<ContractAuditEntry[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setContract(null);
      setAudit([]);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    Promise.all([contractsAdapter.get(id), contractsAdapter.listAuditHistory(id)])
      .then(([foundContract, foundAudit]) => {
        if (cancelled) return;
        setContract(foundContract);
        setAudit(foundAudit);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this contract. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, contract, audit, refetch };
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

export function useCreateContract() {
  const { submit, status, error } = useMutation((input: CreateContractInput, actor: ContractActor) =>
    contractsAdapter.create(input, actor),
  );
  return { submit, status, error };
}

export function useUpdateContract() {
  const { submit, status, error } = useMutation(
    (id: string, patch: UpdateContractInput, actor: ContractActor) => contractsAdapter.update(id, patch, actor),
  );
  return { submit, status, error };
}

export function useSendContractForAcceptance() {
  const { submit, status, error } = useMutation((id: string, actor: ContractActor) =>
    contractsAdapter.sendForAcceptance(id, actor),
  );
  return { submit, status, error };
}

export function useWithdrawContract() {
  const { submit, status, error } = useMutation((id: string, actor: ContractActor) =>
    contractsAdapter.withdraw(id, actor),
  );
  return { submit, status, error };
}

export function useRespondToContract() {
  const { submit, status, error } = useMutation(
    (id: string, decision: "accepted" | "declined", actor: ContractActor, declineReason?: string) =>
      contractsAdapter.respond(id, decision, actor, declineReason),
  );
  return { submit, status, error };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  customersAdapter,
  type CustomerActor,
} from "@/lib/api/adapters/customers-adapter";
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from "@/types/domain/customer";

type Status = "idle" | "loading" | "success" | "error";

/** Customer list — used by the `/admin/customers` list page and `ContractForm`'s picker. */
export function useCustomers() {
  const [status, setStatus] = useState<Status>("idle");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    customersAdapter
      .list()
      .then((res) => {
        if (cancelled) return;
        setCustomers(res);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, customers, refetch };
}

/** Single-customer lookup (by id), for the Customer detail page. */
export function useCustomer(id: string | null) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) {
      setCustomer(null);
      setStatus("idle");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    setError(null);
    customersAdapter
      .get(id)
      .then((res) => {
        if (cancelled) return;
        setCustomer(res);
        setStatus("success");
      })
      .catch((e) => {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not load this customer. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { status, error, customer, refetch };
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

export function useCreateCustomer() {
  return useMutation((input: CreateCustomerInput, actor: CustomerActor) => customersAdapter.create(input, actor));
}

export function useUpdateCustomer() {
  return useMutation((id: string, patch: UpdateCustomerInput, actor: CustomerActor) => customersAdapter.update(id, patch, actor));
}

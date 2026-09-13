"use client";

import { useEffect, useState } from "react";
import { customersAdapter } from "@/lib/api/adapters/customers-adapter";
import type { Customer } from "@/types/domain/customer";

/** Customer picker data for `ContractForm` — see `src/lib/api/adapters/customers-adapter.ts`. */
export function useCustomers() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [customers, setCustomers] = useState<Customer[]>([]);

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
  }, []);

  return { status, customers };
}

"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { CONTRACT_STATUS_CONFIG } from "@/components/contracts/contract-status-config";
import type { ContractListParams } from "@/lib/api/adapters/contracts-adapter";
import type { Customer } from "@/types/domain/customer";
import type { ContractStatus } from "@/types/domain/contract";

const STATUS_ORDER: ContractStatus[] = ["draft", "sent_for_acceptance", "accepted", "declined"];

export function ContractFilters({
  value,
  customers,
  onChange,
}: {
  value: ContractListParams;
  customers: Customer[];
  onChange: (next: ContractListParams) => void;
}) {
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search contract number or title…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search contracts"
      />
      <Select
        value={value.status ?? ""}
        onChange={(e) => onChange({ ...value, status: (e.target.value as ContractStatus) || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {CONTRACT_STATUS_CONFIG[s].label}
          </option>
        ))}
      </Select>
      <Select
        value={value.customerId ?? ""}
        onChange={(e) => onChange({ ...value, customerId: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by customer"
      >
        <option value="">All customers</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

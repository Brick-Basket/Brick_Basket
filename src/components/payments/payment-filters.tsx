"use client";

import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { FilterBar } from "@/components/domain/filter-bar";
import { PAYMENT_DIRECTION_CONFIG } from "@/components/payments/payment-config";
import { useProjects } from "@/hooks/use-projects";
import type { PaymentListParams } from "@/lib/api/adapters/payments-adapter";
import type { PaymentDirection } from "@/types/domain/payment";

/** Search + direction + project filter for the Payments & Receipts tab. */
export function PaymentFilters({ value, onChange }: { value: PaymentListParams; onChange: (next: PaymentListParams) => void }) {
  const { projects: allProjects } = useProjects();
  return (
    <FilterBar>
      <SearchInput
        placeholder="Search reference number…"
        defaultValue={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value, page: 1 })}
        className="w-full sm:w-64"
        aria-label="Search payments"
      />
      <Select
        value={value.direction ?? ""}
        onChange={(e) => onChange({ ...value, direction: (e.target.value as PaymentDirection) || undefined, page: 1 })}
        className="w-full sm:w-56"
        aria-label="Filter by direction"
      >
        <option value="">Payments & receipts</option>
        <option value="payment">{PAYMENT_DIRECTION_CONFIG.payment.label}</option>
        <option value="receipt">{PAYMENT_DIRECTION_CONFIG.receipt.label}</option>
      </Select>
      <Select
        value={value.projectId ?? ""}
        onChange={(e) => onChange({ ...value, projectId: e.target.value || undefined, page: 1 })}
        className="w-full sm:w-48"
        aria-label="Filter by project"
      >
        <option value="">All projects</option>
        {allProjects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </FilterBar>
  );
}

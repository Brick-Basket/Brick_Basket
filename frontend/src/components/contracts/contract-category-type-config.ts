import type { ContractCategoryType } from "@/types/domain/contract";

/**
 * Labels for the contract-level category (owner correction — distinct from
 * `CONTRACT_CATEGORY_CONFIG`, which is the per-line-item category). See
 * `ContractCategoryType`'s doc comment in `src/types/domain/contract.ts`.
 */
export const CONTRACT_CATEGORY_TYPE_CONFIG: Record<ContractCategoryType, { label: string; hint: string }> = {
  ihb: {
    label: "IHB (Individual House Building)",
    hint: "Select the package criteria this build follows.",
  },
  large_construction: {
    label: "Large Construction",
    hint: "Describe every service included — it becomes the contract's description of services.",
  },
  special_services: {
    label: "Special Services",
    hint: "A standalone service engagement — addendum, add-on, or specialty work not tied to a package.",
  },
};

export const CONTRACT_CATEGORY_TYPE_ORDER: ContractCategoryType[] = ["ihb", "large_construction", "special_services"];

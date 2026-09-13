import type { ContractCategory } from "@/types/domain/contract";

/**
 * CONFIGURABLE — see docs/OPEN_QUESTIONS.md #3 and `contract.ts`'s header
 * comment. Reused ahead of schedule from the Part 15 Finance/Cost
 * Accounting category set for internal consistency — not owner-confirmed
 * as the contract line-item category list itself.
 */
export const CONTRACT_CATEGORY_CONFIG: Record<ContractCategory, { label: string }> = {
  civil: { label: "Civil" },
  electrical: { label: "Electrical" },
  plumbing_sanitary: { label: "Plumbing & Sanitary" },
  mechanical: { label: "Mechanical" },
  finishing: { label: "Finishing" },
  labour: { label: "Labour" },
  design_consultancy: { label: "Design & Consultancy" },
  other: { label: "Other" },
};

export const CONTRACT_CATEGORY_ORDER: ContractCategory[] = [
  "civil",
  "electrical",
  "plumbing_sanitary",
  "mechanical",
  "finishing",
  "labour",
  "design_consultancy",
  "other",
];

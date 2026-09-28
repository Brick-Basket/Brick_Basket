import type { Project } from "@/types/domain/project";

/**
 * Mock/demo only — reuses the names from the public Portfolio page for
 * continuity. `customerId` on `proj_commercial_complex`/`proj_modern_residence`
 * added alongside the Documents module's move to contract-scoped uploads
 * (owner corrections) — every document now needs a real contract behind
 * it, and a contract needs a customer, so these two projects (previously
 * customer-less demo rows) were given one each. See `mock/customers.ts`
 * and `mock/contracts.ts`'s `contract_7`/`contract_8`, and docs/OPEN_QUESTIONS.md.
 */
export const mockProjects: Project[] = [
  { id: "proj_commercial_complex", name: "Commercial Complex", location: "Jharsuguda, Odisha", customerId: "cust_rohit_malhotra" },
  { id: "proj_luxury_villa", name: "Luxury Villa", location: "Vadodara, Gujarat", customerId: "u_customer" },
  { id: "proj_modern_residence", name: "Modern Residence", location: "Lucknow, UP", customerId: "cust_modern_residence" },
];

import type { Project } from "@/types/domain/project";

/** Mock/demo only — reuses the names from the public Portfolio page for continuity. */
export const mockProjects: Project[] = [
  { id: "proj_commercial_complex", name: "Commercial Complex", location: "Jharsuguda, Odisha" },
  { id: "proj_luxury_villa", name: "Luxury Villa", location: "Vadodara, Gujarat", customerId: "u_customer" },
  { id: "proj_modern_residence", name: "Modern Residence", location: "Lucknow, UP" },
];

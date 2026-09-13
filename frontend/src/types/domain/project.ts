/**
 * Project — minimal shape for now.
 *
 * Purpose: gives the Part 3 application shell (ProjectSelector, project
 * context) something real to switch between. This is intentionally a thin
 * slice of the eventual `Project` entity — almost every later module
 * (Contracts, Documents, Vendors, Supply Chain, Store, Schedule/DPR,
 * Finance) references a project by ID, and each of those parts will extend
 * this file with the fields it needs rather than duplicating a parallel
 * type. Not tied to one owning part in docs/MODULES.md for that reason.
 *
 * Backend ownership: persistence and the authoritative field set are
 * backend-owned once a real Project module/API exists.
 */
export interface Project {
  id: string;
  name: string;
  location: string;
  /** Distinguishes "my projects" for a customer session in the portal shell. */
  customerId?: string;
}

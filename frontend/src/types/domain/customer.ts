/**
 * Customer — minimal shape, the same kind of thin slice `Project` got in
 * Part 3.
 *
 * Purpose: gives Contract Management (Part 5) something real to link a
 * `Contract` to once a `Lead` converts, per the owner's "Lead → Customer"
 * relationship. Every later customer-facing module (Documents, MRC,
 * Finance/Payments) extends this file with the fields it needs rather than
 * duplicating a parallel type — not tied to one owning part in
 * `docs/MODULES.md` for that reason (same rationale as `project.ts`).
 *
 * Relationships: `leadId` → the originating `Lead` (optional — a customer
 * can be logged directly, without ever existing as a `Lead` record).
 * One demo customer (`id: "u_customer"`) deliberately shares its id with
 * its matching login persona (`src/lib/auth/mock-users.ts`) so the
 * customer portal (`/dashboard/contracts`) can scope "my contracts" the
 * same way `ProjectProvider` already scopes "my projects" — see
 * `docs/OPEN_QUESTIONS.md`. A real backend owns the actual
 * Customer↔User account relationship.
 *
 * Backend ownership: persistence and the authoritative field set are
 * backend-owned once a real Customer/CRM module exists.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadId?: string;
  createdAt: string;
}

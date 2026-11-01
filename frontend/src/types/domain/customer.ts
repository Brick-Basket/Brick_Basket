/**
 * Customer — extended in the Customer Module pass (this pass) from the
 * minimal shape it had since Part 5 (name/email/phone/leadId only, just
 * enough for a Contract-form picker).
 *
 * Owner's scope for the Customer Module (relayed via WhatsApp, see
 * docs/CHANGELOG.md): "Payments", "Progress percentage", "Progress
 * photographs". Of those three, two are already fully modeled elsewhere —
 * Payments via `Payment`/`paymentAdapter` (filter by `customerId`), and
 * Progress photographs via `SiteUpdate`/`siteUpdatesAdapter` (filter by the
 * customer's `projectId`s, `visibleToCustomer: true`) — this file and
 * `project.ts` only needed to grow the third: Progress percentage, plus a
 * proper CRUD surface for the Customer entity itself, since the new admin
 * screens need to create/edit a Customer record directly (see
 * docs/OPEN_QUESTIONS.md for the "can a Customer be created standalone,
 * before any Contract/Lead exists" flag — this pass adds the capability;
 * the owner hasn't confirmed whether it should be reachable from the UI
 * without one).
 *
 * `address`/`alternatePhone`/`notes` are plain FRONTEND IMPLEMENTATION
 * DECISIONS — reasonable profile fields for a customer-detail screen, not
 * anything the owner specified. Flagged in docs/OPEN_QUESTIONS.md rather
 * than silently invented as a permanent contract.
 *
 * Relationships: `leadId` → the originating `Lead` (optional — a customer
 * can be logged directly, without ever existing as a `Lead` record).
 *
 * Backend ownership: persistence and the authoritative field set are
 * backend-owned once a real Customer/CRM module exists.
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** FRONTEND IMPLEMENTATION DECISION (Customer Module pass) — not owner-specified. */
  alternatePhone?: string;
  /** FRONTEND IMPLEMENTATION DECISION (Customer Module pass) — not owner-specified. */
  address?: string;
  /** FRONTEND IMPLEMENTATION DECISION (Customer Module pass) — internal staff note, never shown in the customer portal. */
  notes?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Shape for `CustomersAdapter.create` — mirrors the `Create*Input` pattern used by Vendor/Contract/etc. */
export type CreateCustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt">;

/** Shape for `CustomersAdapter.update` — every field editable except id/createdAt (updatedAt is adapter-managed). */
export type UpdateCustomerInput = Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>;

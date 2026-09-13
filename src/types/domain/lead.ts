/**
 * Lead — a prospective customer enquiry.
 *
 * Purpose: captures inbound interest from any source (public website form,
 * social media, calls/WhatsApp, personal reference) into one composite
 * record, per the owner's Lead Management requirement.
 *
 * Source module: public website Contact page (Part 2) for `source:
 * "website"`; the full Lead Management admin module (Part 4, this file's
 * `assignedTo` addition) reads/writes every source and owns assignment +
 * pipeline-status transitions in the UI.
 * Dependent modules: Lead Management (Part 4) list/pipeline views;
 * Contract Management (Part 5) — an accepted lead becomes a Customer/Project.
 * Backend ownership: persistence, assignment, and pipeline-status transitions
 * are backend-owned. The frontend only creates/reads/updates leads through
 * the adapter boundary (`leads-adapter.ts`) — nothing here is authoritative.
 *
 * Status is intentionally loose (`LeadStatus` below) — the owner requirements
 * establish sources but not a finished pipeline vocabulary; see
 * docs/OPEN_QUESTIONS.md #3.
 */
export type LeadSource = "website" | "social_media" | "call_whatsapp" | "personal_reference";

// CONFIGURABLE — pending confirmation (docs/OPEN_QUESTIONS.md #3). Demo
// pipeline stages only; the backend owns the authoritative vocabulary.
// Order matters — it's the left-to-right column order in the Kanban view
// (see src/components/leads/lead-status-config.ts).
export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  /** Free-text subject/interest, e.g. "Villa construction enquiry". */
  subject: string;
  message: string;
  status: LeadStatus;
  /**
   * Staff user id the lead is assigned to, or null when unassigned. Sourced
   * from the demo staff directory (`src/lib/auth/mock-users.ts`) today —
   * becomes a real Users/Staff lookup once a backend exists.
   */
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload the public Contact form submits — server assigns id/status/timestamps/assignedTo. */
export type CreateLeadInput = Pick<Lead, "name" | "email" | "phone" | "subject" | "message"> & {
  source: LeadSource;
};

/** Fields the admin Lead Management UI (Part 4) may update after creation. */
export type UpdateLeadInput = Partial<
  Pick<Lead, "name" | "email" | "phone" | "subject" | "message" | "assignedTo">
>;

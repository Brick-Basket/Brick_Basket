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
  /** Free-text subject/interest, e.g. "Villa construction enquiry". Still captured on the form; the table/Kanban surface `city` instead — see correction #1 below. */
  subject: string;
  message: string;
  /**
   * City the enquiry is for. FRONTEND IMPLEMENTATION DECISION (owner
   * correction, "in place of subject, city name should reflect"): added as
   * a first-class, required field rather than replacing `subject` outright,
   * since `subject`/`message` still carry real enquiry detail — only the
   * table/Kanban *display* swapped from subject to city. Picked via
   * `CityAutocomplete` (`src/components/ui/city-autocomplete.tsx`) on the
   * form. See docs/OPEN_QUESTIONS.md.
   */
  city: string;
  /**
   * Date the enquiry was actually received, as opposed to `createdAt` (when
   * the record was entered into the system — data entry can lag the real
   * enquiry by days). FRONTEND IMPLEMENTATION DECISION per owner correction
   * #3 ("lead data entry can be done on any date but same should reflect
   * with actual date of receipt") — stored as a plain `YYYY-MM-DD` date
   * string, editable on the create form, defaulting to today. See
   * docs/OPEN_QUESTIONS.md.
   */
  receivedDate: string;
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

/**
 * Payload the public Contact form (and the admin "New Lead" form) submits —
 * server assigns id/status/timestamps/assignedTo. `city`/`receivedDate` are
 * optional here (rather than required, as they are on `Lead` itself)
 * specifically so the public marketing-site Contact form and Cost Estimator
 * enquiry (`src/components/marketing/contact-form.tsx`,
 * `cost-estimator-section.tsx`) — out of scope for the owner's Lead
 * Management corrections, which are about the internal admin module —
 * don't need a city/date field added to keep compiling. `leadsAdapter.create`
 * fills sensible defaults when they're omitted (empty city, today's date);
 * the admin `LeadForm` requires both explicitly via its own zod schema. See
 * docs/OPEN_QUESTIONS.md.
 */
export type CreateLeadInput = Pick<Lead, "name" | "email" | "phone" | "subject" | "message"> &
  Partial<Pick<Lead, "city" | "receivedDate">> & {
    source: LeadSource;
  };

/** Fields the admin Lead Management UI (Part 4) may update after creation. */
export type UpdateLeadInput = Partial<
  Pick<Lead, "name" | "email" | "phone" | "subject" | "message" | "city" | "receivedDate" | "assignedTo">
>;

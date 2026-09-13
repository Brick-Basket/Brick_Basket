/**
 * LeadActivity — a follow-up note logged against a Lead (call made, email
 * sent, status changed, general note). Purpose: the follow-up activity log
 * required by the Lead Management module.
 *
 * Relationships: `leadId` → `Lead`. `authorId` → a staff user (demo
 * directory today, see `src/lib/auth/mock-users.ts`).
 * Source module: Lead Management (Part 4).
 * Backend ownership: persistence is backend-owned; the frontend appends
 * through `LeadsAdapter.addActivity` only.
 */
export type LeadActivityType = "note" | "status_change";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  /** Free-text note, or an auto-generated summary for `type: "status_change"`. */
  message: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

/**
 * ContractAuditEntry — the acceptance/audit history required by Contract
 * Management: every status transition (and edit, while editable) is
 * appended here, distinct from `LeadActivity` because this trail is
 * legally/contractually meaningful, not just a follow-up note.
 *
 * Relationships: `contractId` → `Contract`. `actorId` → a staff user
 * (demo directory, `src/lib/auth/mock-users.ts`) or a `Customer`.
 * Source module: Contract Management (Part 5).
 * Backend ownership: persistence is backend-owned; the frontend appends
 * through `ContractsAdapter`'s mutating methods only — never written
 * directly by a user action, unlike `LeadActivity`'s free-text notes.
 */
export type ContractAuditAction =
  | "created"
  | "updated"
  | "sent_for_acceptance"
  | "withdrawn"
  | "accepted"
  | "declined";

export interface ContractAuditEntry {
  id: string;
  contractId: string;
  action: ContractAuditAction;
  message: string;
  actorId: string;
  actorName: string;
  createdAt: string;
}

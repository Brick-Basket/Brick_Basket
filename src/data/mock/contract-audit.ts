import type { ContractAuditEntry } from "@/types/domain/contract-audit";

/**
 * Mock/demo audit history seeded against `mock/contracts.ts` — never
 * imported outside `contracts-adapter.ts`. Every contract has at least a
 * `created` entry; sent/accepted/declined contracts have the matching
 * trail so the acceptance/audit history view always has something real
 * to show.
 */
export const mockContractAudit: ContractAuditEntry[] = [
  { id: "caud_1_1", contractId: "contract_1", action: "created", message: "Contract created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-09-02T09:00:00.000Z" },
  { id: "caud_1_2", contractId: "contract_1", action: "sent_for_acceptance", message: "Sent to Rohan Verma for review and acceptance.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-09-05T10:00:00.000Z" },

  { id: "caud_2_1", contractId: "contract_2", action: "created", message: "Contract created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-07-08T06:00:00.000Z" },
  { id: "caud_2_2", contractId: "contract_2", action: "sent_for_acceptance", message: "Sent to Rohan Verma for review and acceptance.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-07-10T07:00:00.000Z" },
  { id: "caud_2_3", contractId: "contract_2", action: "accepted", message: "Accepted by Rohan Verma.", actorId: "u_customer", actorName: "Rohan Verma", createdAt: "2026-07-14T12:00:00.000Z" },

  { id: "caud_3_1", contractId: "contract_3", action: "created", message: "Contract created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-09-09T05:00:00.000Z" },

  { id: "caud_4_1", contractId: "contract_4", action: "created", message: "Contract created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-07-18T07:00:00.000Z" },
  { id: "caud_4_2", contractId: "contract_4", action: "sent_for_acceptance", message: "Sent to Arjun Kapoor for review and acceptance.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-07-20T08:00:00.000Z" },
  { id: "caud_4_3", contractId: "contract_4", action: "accepted", message: "Accepted by Arjun Kapoor.", actorId: "cust_arjun_kapoor", actorName: "Arjun Kapoor", createdAt: "2026-07-25T09:00:00.000Z" },

  { id: "caud_5_1", contractId: "contract_5", action: "created", message: "Contract created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-09-07T05:00:00.000Z" },
  { id: "caud_5_2", contractId: "contract_5", action: "sent_for_acceptance", message: "Sent to Arjun Kapoor for review and acceptance.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-09-08T06:00:00.000Z" },

  { id: "caud_6_1", contractId: "contract_6", action: "created", message: "Contract created.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-07-28T06:00:00.000Z" },
  { id: "caud_6_2", contractId: "contract_6", action: "sent_for_acceptance", message: "Sent to Harish Chandran for review and acceptance.", actorId: "u_admin", actorName: "Aditi Sharma", createdAt: "2026-08-01T07:00:00.000Z" },
  { id: "caud_6_3", contractId: "contract_6", action: "declined", message: "Declined by Harish Chandran: Budget higher than expected for the finishing package — requested a revised quote.", actorId: "cust_harish_chandran", actorName: "Harish Chandran", createdAt: "2026-08-05T10:00:00.000Z" },
];

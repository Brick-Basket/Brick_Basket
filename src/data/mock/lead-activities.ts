import type { LeadActivity } from "@/types/domain/lead-activity";

/**
 * Mock/demo follow-up log entries seeded against `mockLeads` — never
 * imported outside `leads-adapter.ts`. A subset of leads has activity
 * history to demonstrate both an empty log (new/unassigned leads) and a
 * populated one.
 */
export const mockLeadActivities: LeadActivity[] = [
  {
    id: "act_seed_1",
    leadId: "lead_seed_1",
    type: "note",
    message: "Called to introduce the design-build process; customer wants a callback next week.",
    authorId: "u_pm",
    authorName: "Karan Mehta",
    createdAt: "2026-08-03T10:00:00.000Z",
  },
  {
    id: "act_seed_2",
    leadId: "lead_seed_1",
    type: "status_change",
    message: 'Status changed from "new" to "contacted".',
    authorId: "u_pm",
    authorName: "Karan Mehta",
    createdAt: "2026-08-04T11:00:00.000Z",
  },
  {
    id: "act_seed_3",
    leadId: "lead_seed_4",
    type: "note",
    message: "Site visit completed on 24 Aug; customer confirmed budget range and timeline.",
    authorId: "u_admin",
    authorName: "Aditi Sharma",
    createdAt: "2026-08-25T09:00:00.000Z",
  },
  {
    id: "act_seed_4",
    leadId: "lead_seed_4",
    type: "status_change",
    message: 'Status changed from "contacted" to "qualified".',
    authorId: "u_admin",
    authorName: "Aditi Sharma",
    createdAt: "2026-08-28T10:30:00.000Z",
  },
  {
    id: "act_seed_5",
    leadId: "lead_seed_8",
    type: "note",
    message: "Contract sent for acceptance — see Contract Management once Part 5 ships.",
    authorId: "u_admin",
    authorName: "Aditi Sharma",
    createdAt: "2026-07-30T09:00:00.000Z",
  },
  {
    id: "act_seed_6",
    leadId: "lead_seed_8",
    type: "status_change",
    message: 'Status changed from "qualified" to "converted".',
    authorId: "u_admin",
    authorName: "Aditi Sharma",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "act_seed_7",
    leadId: "lead_seed_7",
    type: "note",
    message: "Customer went with another contractor over budget mismatch.",
    authorId: "u_pm",
    authorName: "Karan Mehta",
    createdAt: "2026-08-09T06:00:00.000Z",
  },
  {
    id: "act_seed_8",
    leadId: "lead_seed_7",
    type: "status_change",
    message: 'Status changed from "contacted" to "lost".',
    authorId: "u_pm",
    authorName: "Karan Mehta",
    createdAt: "2026-08-10T06:00:00.000Z",
  },
  {
    id: "act_seed_9",
    leadId: "lead_seed_11",
    type: "note",
    message: "Shared the farmhouse portfolio deck; awaiting customer's site plot survey.",
    authorId: "u_admin",
    authorName: "Aditi Sharma",
    createdAt: "2026-08-20T07:00:00.000Z",
  },
  {
    id: "act_seed_10",
    leadId: "lead_seed_14",
    type: "note",
    message: "Single site visit, customer decided quickly — moved straight to conversion.",
    authorId: "u_admin",
    authorName: "Aditi Sharma",
    createdAt: "2026-07-14T08:00:00.000Z",
  },
  {
    id: "act_seed_11",
    leadId: "lead_seed_14",
    type: "status_change",
    message: 'Status changed from "qualified" to "converted".',
    authorId: "u_admin",
    authorName: "Aditi Sharma",
    createdAt: "2026-07-15T09:00:00.000Z",
  },
];

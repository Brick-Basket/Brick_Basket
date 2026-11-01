import type { Customer } from "@/types/domain/customer";

/**
 * Mock/demo dataset only — never imported outside
 * src/lib/api/adapters/contracts-adapter.ts. `cust_u_customer` intentionally
 * shares its id with the `u_customer` demo login persona
 * (src/lib/auth/mock-users.ts) and the `proj_luxury_villa` mock project's
 * `customerId`, so signing in as the demo customer and opening
 * `/dashboard/contracts` shows real, scoped data end to end. The other two
 * customers are converted leads (`lead_seed_8`, `lead_seed_14`) with no
 * login persona of their own — staff-side only, to keep the admin contract
 * list from looking like a single-customer demo.
 */
export const mockCustomers: Customer[] = [
  {
    id: "u_customer",
    name: "Rohan Verma",
    email: "customer@brickbasket.co.in",
    phone: "+91 90000 00001",
    address: "Flat 402, Sunrise Residency, Vadodara, Gujarat",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "cust_arjun_kapoor",
    name: "Arjun Kapoor",
    email: "arjun.kapoor@example.com",
    phone: "+91 95432 10987",
    leadId: "lead_seed_8",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "cust_harish_chandran",
    name: "Harish Chandran",
    email: "harish.c@example.com",
    phone: "+91 89876 54321",
    leadId: "lead_seed_14",
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: "2026-07-15T09:00:00.000Z",
  },
  {
    // Added alongside the Documents module's move to contract-scoped
    // uploads — see mock/projects.ts's header comment and contract_7 below.
    id: "cust_rohit_malhotra",
    name: "Rohit Malhotra",
    email: "rohit.m@example.com",
    phone: "+91 91234 56789",
    leadId: "lead_seed_2",
    address: "12, Civil Lines, Jharsuguda, Odisha",
    createdAt: "2026-09-02T08:00:00.000Z",
    updatedAt: "2026-09-02T08:00:00.000Z",
  },
  {
    // Added alongside the Documents module's move to contract-scoped
    // uploads — a directly-logged customer (no matching seeded Lead), see
    // `Customer.leadId`'s doc comment and contract_8 below.
    id: "cust_modern_residence",
    name: "Owner, Modern Residence",
    email: "modern.residence@example.com",
    phone: "+91 90000 33344",
    address: "Sector 14, Lucknow, UP",
    createdAt: "2026-06-20T09:00:00.000Z",
    updatedAt: "2026-06-20T09:00:00.000Z",
  },
  {
    // Backs `proj_riverside_apartments` — see mock/projects.ts.
    id: "cust_priya_deshmukh",
    name: "Priya Deshmukh",
    email: "priya.deshmukh@example.com",
    phone: "+91 98220 11223",
    address: "Baner Road, Pune, Maharashtra",
    createdAt: "2026-08-10T08:00:00.000Z",
    updatedAt: "2026-08-10T08:00:00.000Z",
  },
  {
    // Backs `proj_heritage_resort` — see mock/projects.ts.
    id: "cust_devendra_rathore",
    name: "Devendra Rathore",
    email: "devendra.rathore@example.com",
    phone: "+91 94140 55667",
    address: "Civil Lines, Jaipur, Rajasthan",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-20T08:00:00.000Z",
  },
  {
    // Backs `proj_gorakhpur_business_park` — see mock/projects.ts.
    id: "cust_suresh_yadav",
    name: "Suresh Yadav",
    email: "suresh.yadav@example.com",
    phone: "+91 98390 77881",
    address: "Golghar, Gorakhpur, Uttar Pradesh",
    createdAt: "2026-09-05T08:00:00.000Z",
    updatedAt: "2026-09-05T08:00:00.000Z",
  },
];

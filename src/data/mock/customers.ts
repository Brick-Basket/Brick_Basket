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
    createdAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "cust_arjun_kapoor",
    name: "Arjun Kapoor",
    email: "arjun.kapoor@example.com",
    phone: "+91 95432 10987",
    leadId: "lead_seed_8",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "cust_harish_chandran",
    name: "Harish Chandran",
    email: "harish.c@example.com",
    phone: "+91 89876 54321",
    leadId: "lead_seed_14",
    createdAt: "2026-07-15T09:00:00.000Z",
  },
];

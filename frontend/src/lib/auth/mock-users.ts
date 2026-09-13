import type { CurrentUser } from "@/lib/auth/types";
import { permissionsForRoles, type Role } from "@/lib/permissions/permissions";

/**
 * Demo persona directory — one recognizable account per role, so RBAC can
 * actually be exercised end to end without a backend. Passwords are not
 * checked against anything; any non-empty value is accepted for these
 * emails. Clearly a mock/demo fixture, not real credentials — never seed a
 * production auth provider from this file.
 */
interface DemoUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
}

const DEMO_USERS: DemoUser[] = [
  { id: "u_admin", name: "Aditi Sharma", email: "admin@brickbasket.co.in", roles: ["admin"] },
  { id: "u_customer", name: "Rohan Verma", email: "customer@brickbasket.co.in", roles: ["customer"] },
  { id: "u_pm", name: "Karan Mehta", email: "pm@brickbasket.co.in", roles: ["project_manager"] },
  { id: "u_engineer", name: "Sana Iqbal", email: "engineer@brickbasket.co.in", roles: ["site_engineer"] },
  { id: "u_purchaser", name: "Vikram Nair", email: "purchaser@brickbasket.co.in", roles: ["purchaser"] },
  { id: "u_store", name: "Meera Joshi", email: "store@brickbasket.co.in", roles: ["store_personnel"] },
  { id: "u_finance", name: "Ananya Gupta", email: "finance@brickbasket.co.in", roles: ["finance"] },
  { id: "u_approver", name: "Rajesh Kumar", email: "approver@brickbasket.co.in", roles: ["approver"] },
];

export function findDemoUserByEmail(email: string): CurrentUser | null {
  const match = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!match) return null;
  return { ...match, permissions: permissionsForRoles(match.roles) };
}

export function demoUserDirectory(): DemoUser[] {
  return DEMO_USERS;
}

/**
 * Staff directory for assignment pickers (Lead Management, Part 4, and
 * later modules). Excludes the `customer` persona — a lead is never
 * assigned to a customer. Real staff directory is backend-owned; this is
 * the same demo fixture `DEMO_USERS` draws from, filtered to staff roles.
 */
export function assignableStaffDirectory(): { id: string; name: string; roles: Role[] }[] {
  return DEMO_USERS.filter((u) => !u.roles.includes("customer")).map((u) => ({
    id: u.id,
    name: u.name,
    roles: u.roles,
  }));
}

export function findDemoUserById(id: string): DemoUser | null {
  return DEMO_USERS.find((u) => u.id === id) ?? null;
}
